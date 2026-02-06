import type { VercelResponse } from '@vercel/node';
import { admin, db } from '../lib/firebaseAdmin.js';
import { RATE_LIMIT_MAX_MESSAGES, RATE_LIMIT_WINDOW_MS } from './constants.js';
import type { RateLimitResult } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const toMillis = (value: unknown): number | null => {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const numericValue = toFiniteNumber(value);
  if (numericValue !== null) {
    return numericValue;
  }

  if (isRecord(value) && typeof value.toMillis === 'function') {
    try {
      const millis = value.toMillis();
      return typeof millis === 'number' && Number.isFinite(millis) ? millis : null;
    } catch {
      return null;
    }
  }

  return null;
};

export const incrementAndCheckRateLimit = async (uid: string): Promise<RateLimitResult> => {
  const usageRef = db.collection('users').doc(uid).collection('chatUsage').doc('current');

  return db.runTransaction(async (transaction) => {
    const usageDoc = await transaction.get(usageRef);
    const nowMs = Date.now();

    let windowStartedAtMs = nowMs;
    let messagesThisHour = 0;

    if (usageDoc.exists) {
      const usageData = usageDoc.data() ?? {};
      const existingWindowStart = toMillis(usageData.windowStartedAt);
      const existingCount = toFiniteNumber(usageData.messagesThisHour);

      if (existingWindowStart !== null) {
        windowStartedAtMs = existingWindowStart;
      }
      if (existingCount !== null && existingCount > 0) {
        messagesThisHour = Math.floor(existingCount);
      }
    }

    if (nowMs - windowStartedAtMs >= RATE_LIMIT_WINDOW_MS) {
      windowStartedAtMs = nowMs;
      messagesThisHour = 0;
    }

    if (messagesThisHour >= RATE_LIMIT_MAX_MESSAGES) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(windowStartedAtMs + RATE_LIMIT_WINDOW_MS),
      };
    }

    const nextCount = messagesThisHour + 1;

    transaction.set(
      usageRef,
      {
        messagesThisHour: nextCount,
        windowStartedAt: admin.firestore.Timestamp.fromMillis(windowStartedAtMs),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_MESSAGES - nextCount,
      resetAt: new Date(windowStartedAtMs + RATE_LIMIT_WINDOW_MS),
    };
  });
};

export const setRateLimitHeaders = (res: VercelResponse, rateLimit: RateLimitResult): void => {
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_MESSAGES));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
};
