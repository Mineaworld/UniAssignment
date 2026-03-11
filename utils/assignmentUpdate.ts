import { Assignment } from '../types';

const shouldResetReminderSentAt = (updates: Partial<Assignment>): boolean => {
  return (updates.dueDate !== undefined || updates.reminder !== undefined) &&
    Boolean(updates.reminder?.enabled);
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

    processedUpdates[key] = value === undefined ? createDeleteToken() : value;
  }

  return processedUpdates;
};
