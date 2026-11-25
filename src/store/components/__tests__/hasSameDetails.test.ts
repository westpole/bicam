import { storedComponent } from '../__mocks__/storedComponent';
import type { ComponentDetails } from '../types';
import { hasSameDetails } from '../utilities/hasSameDetails';

describe('hasSameDetails', () => {
  const chain = storedComponent('chain-1', 'chain', 'X12', { label: 'A', initialDistance: 120 });

  it('is true for equal details, also with another limits object', () => {
    expect(hasSameDetails(chain, { ...chain, limits: { ...chain.limits } })).toBe(true);
  });

  it.each<[string, Partial<ComponentDetails>]>([
    ['type', { type: 'cassette' }],
    ['model', { model: 'X11' }],
    ['label', { label: null }],
    ['initialDistance', { initialDistance: 0 }],
    ['limits.distance', { limits: { ...chain.limits, distance: 4000 } }],
    ['limits.stretch', { limits: { ...chain.limits, stretch: 0.75 } }],
    ['limits.lubrication', { limits: { ...chain.limits, lubrication: null } }],
    ['limits.cleaning', { limits: { ...chain.limits, cleaning: 1000 } }],
  ])('is false when %s differs', (_field, changes) => {
    expect(hasSameDetails(chain, { ...chain, ...changes })).toBe(false);
  });
});
