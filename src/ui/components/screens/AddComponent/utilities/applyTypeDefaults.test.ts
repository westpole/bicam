import type { ComponentLimits } from '@store/components/types';

import { EMPTY_ADD_COMPONENT_VALUES } from '../constants';
import { applyTypeDefaults } from './applyTypeDefaults';

const NONE: ReadonlySet<keyof ComponentLimits> = new Set();

describe('applyTypeDefaults', () => {
  it('sets the type and fills the chain suggestions', () => {
    expect(applyTypeDefaults(EMPTY_ADD_COMPONENT_VALUES, 'chain', NONE)).toEqual({
      ...EMPTY_ADD_COMPONENT_VALUES,
      type: 'chain',
      'limits.stretch': '0.5',
      'limits.lubrication': '300',
      'limits.cleaning': '1500',
    });
  });

  it.each(['tire', ''])('clears the suggestions again for %j', (type) => {
    const chain = applyTypeDefaults(EMPTY_ADD_COMPONENT_VALUES, 'chain', NONE);

    expect(applyTypeDefaults(chain, type, NONE)).toEqual({ ...EMPTY_ADD_COMPONENT_VALUES, type });
  });

  it('keeps the limits the rider edited', () => {
    const values = { ...EMPTY_ADD_COMPONENT_VALUES, 'limits.distance': '4000', 'limits.stretch': '0.75' };

    expect(applyTypeDefaults(values, 'chain', new Set(['distance', 'stretch']))).toMatchObject({
      'limits.distance': '4000',
      'limits.stretch': '0.75',
      'limits.lubrication': '300',
    });
  });

  it('keeps the other fields and does not mutate the draft', () => {
    const values = { ...EMPTY_ADD_COMPONENT_VALUES, model: 'X12', label: 'A' };

    const next = applyTypeDefaults(values, 'chain', NONE);

    expect(next).toMatchObject({ model: 'X12', label: 'A' });
    expect(values.type).toBe('');
  });
});
