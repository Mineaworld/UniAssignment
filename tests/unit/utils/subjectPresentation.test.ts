import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatSubjectLastUpdated,
  getSubjectInitials,
} from '../../../utils/subjectPresentation';

describe('subjectPresentation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 11, 14, 45, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds initials from single and multi-word subject names', () => {
    expect(getSubjectInitials('Math')).toBe('MA');
    expect(getSubjectInitials('Advanced Calculus')).toBe('AC');
    expect(getSubjectInitials('  data   structures  ')).toBe('DS');
  });

  it('formats absolute last-updated timestamps when valid', () => {
    expect(formatSubjectLastUpdated('2026-03-10T09:30:00.000Z')).not.toBe('Recently updated');
  });

  it('falls back to createdAt when lastUpdated is a legacy display string', () => {
    const formatted = formatSubjectLastUpdated('Just now', '2026-03-09T16:15:00.000Z');

    expect(formatted).not.toContain('Just now');
    expect(formatted).not.toBe('Recently updated');
  });
});
