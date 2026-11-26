import { getToday } from './getToday';

describe('getToday', () => {
  it('formats the local date with zero-padded month and day', () => {
    expect(getToday(new Date(2026, 0, 5, 9, 0))).toBe('2026-01-05');
  });

  it('uses the local calendar day, also late in the evening', () => {
    expect(getToday(new Date(2026, 3, 12, 23, 59))).toBe('2026-04-12');
  });

  it('reads the current time by default', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 25, 12, 0));

    try {
      expect(getToday()).toBe('2026-11-25');
    } finally {
      vi.useRealTimers();
    }
  });
});
