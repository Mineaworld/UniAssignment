import type { VercelRequest } from '@vercel/node';
import { z } from 'zod';
import { ChatRequestSchema, type ChatRequestBody } from './types.js';

const PAYLOAD_LIMIT_EXCEEDED_CODE = 'PAYLOAD_LIMIT_EXCEEDED';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasPayloadLimitIssue = (issues: z.ZodIssue[]): boolean =>
  issues.some((issue) => {
    if (
      issue.code === z.ZodIssueCode.too_big &&
      issue.path[0] === 'messages'
    ) {
      return true;
    }

    if (
      issue.code === z.ZodIssueCode.custom &&
      isRecord(issue.params) &&
      issue.params.code === PAYLOAD_LIMIT_EXCEEDED_CODE
    ) {
      return true;
    }

    return false;
  });

export class ChatRequestValidationError extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST_BODY' | 'PAYLOAD_LIMIT_EXCEEDED',
    message: string,
  ) {
    super(message);
    this.name = 'ChatRequestValidationError';
  }
}

export const getBearerToken = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : null;
};

export const parseRequestBody = (req: VercelRequest): ChatRequestBody => {
  let rawBody: unknown;
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      rawBody = JSON.parse(req.body);
    } catch {
      throw new ChatRequestValidationError(
        'INVALID_REQUEST_BODY',
        'Malformed JSON in request body.',
      );
    }
  } else {
    rawBody = req.body;
  }

  try {
    return ChatRequestSchema.parse(rawBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const code = hasPayloadLimitIssue(error.issues)
        ? 'PAYLOAD_LIMIT_EXCEEDED'
        : 'INVALID_REQUEST_BODY';
      const message = error.issues[0]?.message ?? 'Invalid request body.';

      throw new ChatRequestValidationError(code, message);
    }

    throw new ChatRequestValidationError(
      'INVALID_REQUEST_BODY',
      'Invalid request body.',
    );
  }
};
