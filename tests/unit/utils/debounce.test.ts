import { debounce } from '../../../utils/debounce';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes only the latest call after wait duration', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);

    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(100);
    debounced('third');

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('third');
  });
});
