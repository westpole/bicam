import { COMPONENT_LIMITS } from '@store/components/constants';

import { getDistanceAtReading } from './getDistanceAtReading';

/** Chain A of the worked example after the late swap: 2900 km, in use since 3100, odometer 4500. */
const CHAIN_A = { distance: 2900, distanceSinceInstalled: 1400 };

describe('getDistanceAtReading', () => {
  it('is the current distance at the current odometer', () => {
    expect(getDistanceAtReading(CHAIN_A, 4500, 4500)).toEqual({ ok: true, distance: 2900 });
  });

  it('subtracts the kilometres ridden since the reading', () => {
    expect(getDistanceAtReading(CHAIN_A, 4500, 4000)).toEqual({ ok: true, distance: 2400 });
  });

  it('accepts the installation reading itself', () => {
    expect(getDistanceAtReading(CHAIN_A, 4500, 3100)).toEqual({ ok: true, distance: 1500 });
  });

  it('keeps 1 decimal exact', () => {
    expect(getDistanceAtReading({ distance: 0.3, distanceSinceInstalled: 0.3 }, 3100.5, 3100.4)).toEqual({
      ok: true,
      distance: 0.2,
    });
  });

  it('rejects a reading above the odometer, naming the accepted readings', () => {
    expect(getDistanceAtReading(CHAIN_A, 4500, 4500.1)).toEqual({
      ok: false,
      code: 'aboveOdometer',
      min: 3100,
      max: 4500,
    });
  });

  it('rejects a reading before the installation', () => {
    expect(getDistanceAtReading(CHAIN_A, 4500, 3099.9)).toEqual({
      ok: false,
      code: 'beforeInstallation',
      min: 3100,
      max: 4500,
    });
  });

  it('gives a resting component its current distance, whatever the reading', () => {
    expect(getDistanceAtReading({ distance: 1600, distanceSinceInstalled: null }, 4500, 0)).toEqual({
      ok: true,
      distance: 1600,
    });
  });

  it('caps the distance at the most a history entry accepts', () => {
    const worn = { distance: COMPONENT_LIMITS.distanceMax + 10, distanceSinceInstalled: 500_000 };

    expect(getDistanceAtReading(worn, 500_000, 500_000)).toEqual({ ok: true, distance: COMPONENT_LIMITS.distanceMax });
    expect(getDistanceAtReading(worn, 500_000, 499_995)).toEqual({ ok: true, distance: COMPONENT_LIMITS.distanceMax });
    expect(getDistanceAtReading({ ...worn, distanceSinceInstalled: null }, 0, 0)).toEqual({
      ok: true,
      distance: COMPONENT_LIMITS.distanceMax,
    });
  });
});
