import { AssignmentReminder, ReminderPreset } from '../types';

// Constants
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// Preset to minutes mapping
const PRESET_MINUTES: Record<ReminderPreset, number> = {
  [ReminderPreset.OneHour]: 60,
  [ReminderPreset.SixHours]: 360,
  [ReminderPreset.OneDay]: 1440,
  [ReminderPreset.ThreeDays]: 4320,
  [ReminderPreset.OneWeek]: 10080,
  [ReminderPreset.Custom]: 0,
};

// Helper: Format time before due with proper pluralization
function formatTimeBeforeDue(hours: number): string {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Calculate when reminder should trigger based on due date and reminder settings
 */
export function calculateReminderTime(dueDate: string, reminder: AssignmentReminder): Date | null {
  const due = new Date(dueDate);

  if (reminder.preset !== ReminderPreset.Custom) {
    const minutes = PRESET_MINUTES[reminder.preset];
    return new Date(due.getTime() - minutes * MS_PER_MINUTE);
  }

  if (reminder.customTime) {
    return new Date(reminder.customTime);
  }

  if (reminder.customMinutes) {
    return new Date(due.getTime() - reminder.customMinutes * MS_PER_MINUTE);
  }

  return null;
}

/**
 * Format reminder for display in UI
 */
export function formatReminderText(dueDate: string, reminder: AssignmentReminder): string {
  const due = new Date(dueDate);
  const reminderTime = calculateReminderTime(dueDate, reminder);

  if (!reminderTime) return 'Reminder set';

  if (reminder.preset !== ReminderPreset.Custom) {
    const hoursBefore = (due.getTime() - reminderTime.getTime()) / MS_PER_HOUR;
    return `${formatTimeBeforeDue(hoursBefore)} before due`;
  }

  if (reminder.customTime) {
    return `On ${reminderTime.toLocaleDateString()} at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (reminder.customMinutes) {
    const hoursBefore = reminder.customMinutes / 60;
    return `${formatTimeBeforeDue(hoursBefore)} before due`;
  }

  return 'Custom reminder';
}

/**
 * Check if reminder is due within a time window (for scheduled checks)
 */
export function isReminderDue(
  reminder: AssignmentReminder,
  dueDate: string,
  windowStart: Date,
  windowEnd: Date
): boolean {
  if (!reminder.enabled || reminder.sentAt) return false;

  const reminderTime = calculateReminderTime(dueDate, reminder);
  if (!reminderTime) return false;

  return reminderTime >= windowStart && reminderTime <= windowEnd;
}

/**
 * Get preset short label for buttons
 */
export function getPresetShort(preset: ReminderPreset): string {
  const shorts: Record<ReminderPreset, string> = {
    [ReminderPreset.OneHour]: '1h',
    [ReminderPreset.SixHours]: '6h',
    [ReminderPreset.OneDay]: '1d',
    [ReminderPreset.ThreeDays]: '3d',
    [ReminderPreset.OneWeek]: '1w',
    [ReminderPreset.Custom]: 'custom',
  };
  return shorts[preset];
}
