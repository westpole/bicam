import { CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW, TAPE_RESTING_ROW, WHEEL_IN_USE_ROW } from '@ui/components/ComponentList/__mocks__/rows';

import { getTypesWithoutUse } from './getTypesWithoutUse';

describe('getTypesWithoutUse', () => {
  it('is empty without components', () => {
    expect(getTypesWithoutUse([])).toEqual([]);
  });

  it('lists each type whose components all rest, once, in order of appearance', () => {
    const otherTape = { ...TAPE_RESTING_ROW, component: { ...TAPE_RESTING_ROW.component, id: 'tape-2' } };

    expect(getTypesWithoutUse([TAPE_RESTING_ROW, CHAIN_RESTING_ROW, otherTape, WHEEL_IN_USE_ROW])).toEqual([
      'barTape',
      'chain',
    ]);
  });

  it('leaves out a type with one component in use, even when others rest', () => {
    expect(getTypesWithoutUse([CHAIN_RESTING_ROW, CHAIN_IN_USE_ROW])).toEqual([]);
  });
});
