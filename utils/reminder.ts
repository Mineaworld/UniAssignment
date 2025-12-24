import { AssignmentReminder, ReminderPreset } from '../types';

// Preset to minutes mapping
const PRESET_MINUTES: Record<ReminderPreset, number> = {
  [ReminderPreset.OneHour]: 60,
  [ReminderPreset.SixHours]: 360,
  [ReminderPreset.OneDay]: 1440,
  [ReminderPreset.ThreeDays]: 4320,
  [ReminderPreset.OneWeek]: 10080,
  [ReminderPreset.Custom]: 0,
};

/**
 * Calculate when reminder should trigger based on due date and reminder settings
 */
export function calculateReminderTime(dueDate: string, reminder: AssignmentReminder): Date | null {
  const due = new Date(dueDate);

  if (reminder.preset !== ReminderPreset.Custom) {
    const minutes = PRESET_MINUTES[reminder.preset];
    return new Date(due.getTime() - minutes * 60 * 1000);
  }

  if (reminder.customTime) {
    return new Date(reminder.customTime);
  }

  if (reminder.customMinutes) {
    return new Date(due.getTime() - reminder.customMinutes * 60 * 1000);
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
    const hoursBefore = Math.round((due.getTime() - reminderTime.getTime()) / (1000 * 60 * 60));
    if (hoursBefore < 24) {
      return `${hoursBefore} hour${hoursBefore !== 1 ? 's' : ''} before due`;
    }
    return `${Math.round(hoursBefore / 24)} day${Math.round(hoursBefore / 24) !== 1 ? 's' : ''} before due`;
  }

  if (reminder.customTime) {
    return `On ${reminderTime.toLocaleDateString()} at ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (reminder.customMinutes) {
    const hoursBefore = Math.round(reminder.customMinutes / 60);
    if (hoursBefore < 24) {
      return `${hoursBefore} hour${hoursBefore !== 1 ? 's' : ''} before due`;
    }
    return `${Math.round(hoursBefore / 24)} day${Math.round(hoursBefore / 24) !== 1 ? 's' : ''} before due`;
  }

  return 'Custom reminder';
}

/**
 * Check if reminder is due within a time window (for scheduled checks)
 */
export function isReminderDue(reminder: AssignmentReminder, dueDate: string, windowStart: Date, windowEnd: Date): boolean {
  if (!reminder.enabled || reminder.sentAt) return false;

  const reminderTime = calculateReminderTime(dueDate, reminder);
  if (!reminderTime) return false;

  return reminderTime >= windowStart && reminderTime <= windowEnd;
}

/**
 * Get preset label for display
 */
export function getPresetLabel(preset: ReminderPreset): string {
  const labels: Record<ReminderPreset, string> = {
    [ReminderPreset.OneHour]: '1 hour before',
    [ReminderPreset.SixHours]: '6 hours before',
    [ReminderPreset.OneDay]: '1 day before',
    [ReminderPreset.ThreeDays]: '3 days before',
    [ReminderPreset.OneWeek]: '1 week before',
    [ReminderPreset.Custom]: 'Custom',
  };
  return labels[preset];
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
