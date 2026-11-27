import { getReadingRange } from './getReadingRange';

describe('getReadingRange', () => {
  it('runs from the installation to the odometer', () => {
    expect(getReadingRange({ distanceSinceInstalled: 1400 }, 4500)).toEqual({ min: 3100, max: 4500 });
  });

  it('keeps 1 decimal exact', () => {
    expect(getReadingRange({ distanceSinceInstalled: 1400.2 }, 3100.5)).toEqual({ min: 1700.3, max: 3100.5 });
  });

  it('is null for a resting component', () => {
    expect(getReadingRange({ distanceSinceInstalled: null }, 4500)).toBeNull();
  });
});
