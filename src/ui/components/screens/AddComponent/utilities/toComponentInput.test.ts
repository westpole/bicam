import { EMPTY_ADD_COMPONENT_VALUES } from '../constants';
import type { AddComponentValues } from '../types';
import { toComponentInput } from './toComponentInput';

const CHAIN: AddComponentValues = {
  ...EMPTY_ADD_COMPONENT_VALUES,
  type: 'chain',
  model: ' KMC X12 ',
  label: ' A ',
  initialDistance: '412.5',
  'limits.distance': '',
  'limits.stretch': '0.5',
  'limits.lubrication': '300',
  'limits.cleaning': '1500',
};

describe('toComponentInput', () => {
  it('passes text as typed and parses every chain limit', () => {
    expect(toComponentInput(CHAIN)).toEqual({
      type: 'chain',
      model: ' KMC X12 ',
      label: ' A ',
      initialDistance: 412.5,
      limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 },
    });
  });

  it('leaves out an empty starting distance', () => {
    expect(toComponentInput({ ...CHAIN, initialDistance: ' ' })).not.toHaveProperty('initialDistance');
  });

  it('passes a starting distance of 0', () => {
    expect(toComponentInput({ ...CHAIN, initialDistance: '0' }).initialDistance).toBe(0);
  });

  it('leaves out chain-only limits for other types, also edited ones', () => {
    expect(toComponentInput({ ...CHAIN, type: 'tire', 'limits.distance': '4000' }).limits).toEqual({ distance: 4000 });
  });

  it('leaves out chain-only limits before a type is chosen', () => {
    expect(toComponentInput({ ...CHAIN, type: '' }).limits).toEqual({ distance: null });
  });

  it('passes text that is not a number as NaN', () => {
    const input = toComponentInput({ ...CHAIN, initialDistance: '1,5', 'limits.cleaning': 'often' });

    expect(input.initialDistance).toBeNaN();
    expect(input.limits?.cleaning).toBeNaN();
  });
});
