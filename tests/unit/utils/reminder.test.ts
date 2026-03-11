import {
  calculateReminderTime,
  formatReminderText,
  getPresetShort,
  isReminderDue,
} from '../../../utils/reminder';
import { ReminderPreset, type AssignmentReminder } from '../../../types';
import { describe, expect, it } from 'vitest';

describe('reminder utils', () => {
  it('calculates preset reminder time before due date', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.OneDay,
    };

    const reminderTime = calculateReminderTime(dueDate, reminder);

    expect(reminderTime?.toISOString()).toBe('2026-03-09T12:00:00.000Z');
  });

  it('returns custom absolute reminder time when provided', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.Custom,
      customTime: '2026-03-08T15:45:00.000Z',
    };

    const reminderTime = calculateReminderTime(dueDate, reminder);

    expect(reminderTime?.toISOString()).toBe('2026-03-08T15:45:00.000Z');
  });

  it('returns custom relative reminder time in minutes', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.Custom,
      customMinutes: 90,
    };

    const reminderTime = calculateReminderTime(dueDate, reminder);

    expect(reminderTime?.toISOString()).toBe('2026-03-10T10:30:00.000Z');
  });

  it('formats preset reminder text', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.OneHour,
    };

    expect(formatReminderText(dueDate, reminder)).toBe('1 hour before due');
  });

  it('formats custom absolute reminder text', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.Custom,
      customTime: '2026-03-08T15:45:00.000Z',
    };

    const text = formatReminderText(dueDate, reminder);

    expect(text.startsWith('On ')).toBe(true);
    expect(text.includes('at')).toBe(true);
  });

  it('detects whether reminder falls inside a check window', () => {
    const dueDate = '2026-03-10T12:00:00.000Z';
    const reminder: AssignmentReminder = {
      enabled: true,
      preset: ReminderPreset.OneHour,
    };

    const inWindow = isReminderDue(
      reminder,
      dueDate,
      new Date('2026-03-10T10:30:00.000Z'),
      new Date('2026-03-10T11:30:00.000Z')
    );

    const outOfWindow = isReminderDue(
      reminder,
      dueDate,
      new Date('2026-03-10T08:00:00.000Z'),
      new Date('2026-03-10T09:00:00.000Z')
    );

    expect(inWindow).toBe(true);
    expect(outOfWindow).toBe(false);
  });

  it('returns short labels for presets', () => {
    expect(getPresetShort(ReminderPreset.OneHour)).toBe('1h');
    expect(getPresetShort(ReminderPreset.SixHours)).toBe('6h');
    expect(getPresetShort(ReminderPreset.OneDay)).toBe('1d');
    expect(getPresetShort(ReminderPreset.ThreeDays)).toBe('3d');
    expect(getPresetShort(ReminderPreset.OneWeek)).toBe('1w');
    expect(getPresetShort(ReminderPreset.Custom)).toBe('custom');
  });
});
