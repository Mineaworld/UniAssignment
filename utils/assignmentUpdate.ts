import { Assignment } from '../types';

const shouldResetReminderSentAt = (updates: Partial<Assignment>): boolean => {
  return (updates.dueDate !== undefined || updates.reminder !== undefined) &&
    Boolean(updates.reminder?.enabled);
};

/**
 * Recursively strips undefined values from nested objects and arrays.
 * Preserves null and other primitive values.
 */
const stripUndefinedDeep = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item));
  }

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    const stripped = stripUndefinedDeep(val);
    if (stripped !== undefined) {
      result[key] = stripped;
    }
  }

  return result;
};

/**
 * Prepares assignment updates for Firestore by resetting reminder.sentAt where needed
 * and replacing undefined values with delete tokens.
 */
export const prepareAssignmentUpdates = <TDeleteToken>(
  updates: Partial<Assignment>,
  createDeleteToken: () => TDeleteToken
): Record<string, unknown | TDeleteToken> => {
  let normalizedUpdates = updates;

  if (shouldResetReminderSentAt(normalizedUpdates) && normalizedUpdates.reminder) {
    normalizedUpdates = {
      ...normalizedUpdates,
      reminder: {
        ...normalizedUpdates.reminder,
        sentAt: undefined,
      },
    };
  }

  const processedUpdates: Record<string, unknown | TDeleteToken> = {};

  for (const [key, value] of Object.entries(normalizedUpdates)) {
    if (key === 'reminder' && value !== undefined && typeof value === 'object' && value !== null) {
      const reminderObj = value as unknown as Record<string, unknown>;

      for (const [reminderKey, reminderValue] of Object.entries(reminderObj)) {
        processedUpdates[`reminder.${reminderKey}`] = reminderValue === undefined
          ? createDeleteToken()
          : reminderValue;
      }
      continue;
    }

    if (value === undefined) {
      processedUpdates[key] = createDeleteToken();
    } else if (typeof value === 'object' && value !== null) {
      processedUpdates[key] = stripUndefinedDeep(value);
    } else {
      processedUpdates[key] = value;
    }
  }

  return processedUpdates;
};