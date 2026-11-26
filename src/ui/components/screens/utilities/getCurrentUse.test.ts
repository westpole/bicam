import { BICYCLES } from '../Home/__mocks__/bicycles';
import { getCurrentUse } from './getCurrentUse';

describe('getCurrentUse', () => {
  const bicycle = { ...BICYCLES[0], odometer: 1500 };
  const now = new Date(2026, 10, 25, 23, 30);

  it('starts today at the odometer, replacing nothing by default', () => {
    expect(getCurrentUse(bicycle, undefined, now)).toEqual({ date: '2026-11-25', odometer: 1500, replaces: null });
  });

  it('names the replaced component', () => {
    expect(getCurrentUse(bicycle, 'chain-a', now)).toEqual({ date: '2026-11-25', odometer: 1500, replaces: 'chain-a' });
  });
});
