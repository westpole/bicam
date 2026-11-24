import type { ComponentInput } from '../types';
import { normalizeComponentInput } from '../utilities/normalizeComponentInput';

describe('normalizeComponentInput', () => {
  it('trims every field and keeps inner whitespace and case', () => {
    expect(normalizeComponentInput({ type: ' chain ', model: '  Shimano  CN-M8100 ' })).toEqual({
      type: 'chain',
      model: 'Shimano  CN-M8100',
    });
  });

  it('picks known fields only', () => {
    const input = { type: 'chain', model: 'CN-M8100', id: 'chosen-id', history: [{ id: 'h' }], extra: 1 };

    expect(normalizeComponentInput(input)).toEqual({ type: 'chain', model: 'CN-M8100' });
  });

  it('does not mutate the input', () => {
    const input: ComponentInput = { type: ' chain ', model: ' CN-M8100 ' };

    normalizeComponentInput(input);

    expect(input).toEqual({ type: ' chain ', model: ' CN-M8100 ' });
  });
});
