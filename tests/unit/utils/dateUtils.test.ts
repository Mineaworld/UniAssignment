import {
  formatDueDate,
  formatRelativeDate,
  getDaysUntilDue,
  isOverdue,
} from '../../../utils/dateUtils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 10, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates days until due from start-of-day', () => {
    const dueDate = new Date(2026, 0, 12, 8, 30, 0);

    expect(getDaysUntilDue(dueDate)).toBe(2);
  });

  it('detects overdue only when incomplete', () => {
    const dueDate = new Date(2026, 0, 9, 10, 0, 0);

    expect(isOverdue(dueDate, false)).toBe(true);
    expect(isOverdue(dueDate, true)).toBe(false);
  });

  it('formats overdue due date info', () => {
    const dueDate = new Date(2026, 0, 9, 9, 0, 0);

    const info = formatDueDate(dueDate, false);

    expect(info.main).toBe('Overdue');
    expect(info.urgent).toBe(true);
    expect(info.sub.length).toBeGreaterThan(0);
  });

  it('formats today and tomorrow labels', () => {
    const todayInfo = formatDueDate(new Date(2026, 0, 10, 18, 30, 0));
    const tomorrowInfo = formatDueDate(new Date(2026, 0, 11, 9, 0, 0));

    expect(todayInfo.main).toBe('Today');
    expect(todayInfo.urgent).toBe(true);
    expect(tomorrowInfo.main).toBe('Tomorrow');
    expect(tomorrowInfo.urgent).toBe(true);
  });

  it('formats relative days for upcoming dates within a week', () => {
    const info = formatDueDate(new Date(2026, 0, 13, 12, 0, 0));

    expect(info.main).toBe('3 days');
    expect(info.urgent).toBe(false);
    expect(info.sub).toContain('Tue');
  });

  it('formats long-range due dates with a month/day label', () => {
    const info = formatDueDate(new Date(2026, 0, 22, 12, 0, 0));

    expect(info.urgent).toBe(false);
    expect(info.main).not.toBe('Today');
    expect(info.main).not.toBe('Tomorrow');
    expect(info.main).not.toBe('Overdue');
  });

  it('formats relative date text correctly', () => {
    expect(formatRelativeDate(new Date(2026, 0, 9, 12, 0, 0))).toBe('Overdue');
    expect(formatRelativeDate(new Date(2026, 0, 10, 12, 0, 0))).toBe('Today');
    expect(formatRelativeDate(new Date(2026, 0, 11, 12, 0, 0))).toBe('Tomorrow');
    expect(formatRelativeDate(new Date(2026, 0, 14, 12, 0, 0))).toBe('4 days');
  });
});
