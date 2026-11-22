import type { BicycleInput } from '../types';
import { normalizeBicycleInput } from '../utilities/normalizeBicycleInput';

describe('normalizeBicycleInput', () => {
  it('trims every string, including component ids', () => {
    const result = normalizeBicycleInput({
      name: '  Gravel Grinder ',
      company: ' Canyon',
      model: 'Grizl CF SL 7  ',
      purchased: ' 2024-05-17 ',
      size: ' M/L ',
      frameGeometry: '\n Stack 594 mm\nReach 393 mm \n',
      components: [' chain-1 ', 'cassette-1'],
    });

    expect(result).toEqual({
      name: 'Gravel Grinder',
      company: 'Canyon',
      model: 'Grizl CF SL 7',
      purchased: '2024-05-17',
      size: 'M/L',
      frameGeometry: 'Stack 594 mm\nReach 393 mm',
      components: ['chain-1', 'cassette-1'],
    });
  });

  it('turns missing optional fields into null and a missing components list into []', () => {
    expect(normalizeBicycleInput({ name: 'Roadie', company: 'Canyon', model: 'Ultimate' })).toEqual({
      name: 'Roadie',
      company: 'Canyon',
      model: 'Ultimate',
      purchased: null,
      size: null,
      frameGeometry: null,
      components: [],
    });
  });

  it('turns null and blank optional text into null', () => {
    const result = normalizeBicycleInput({
      name: 'Roadie',
      company: 'Canyon',
      model: 'Ultimate',
      purchased: null,
      size: '   ',
      frameGeometry: '',
    });

    expect(result).toMatchObject({ purchased: null, size: null, frameGeometry: null });
  });

  it('keeps required fields as empty strings so validation can report them', () => {
    expect(normalizeBicycleInput({ name: '  ', company: '', model: ' ' })).toMatchObject({
      name: '',
      company: '',
      model: '',
    });
  });

  it('keeps case, inner spaces, and duplicate component ids unchanged', () => {
    const result = normalizeBicycleInput({
      name: 'My  Bike',
      company: 'canyon',
      model: 'Ultimate',
      size: 'ml',
      components: ['a', 'a'],
    });

    expect(result).toMatchObject({ name: 'My  Bike', company: 'canyon', size: 'ml', components: ['a', 'a'] });
  });

  it('picks known fields only, so an id key is dropped', () => {
    const input = { id: 'chosen-id', name: 'Roadie', company: 'Canyon', model: 'Ultimate' } as BicycleInput;

    expect(normalizeBicycleInput(input)).not.toHaveProperty('id');
  });

  it('does not mutate the input', () => {
    const input: BicycleInput = { name: ' Roadie ', company: 'Canyon', model: 'Ultimate', components: [' a '] };
    const snapshot = structuredClone(input);

    const result = normalizeBicycleInput(input);

    expect(input).toEqual(snapshot);
    expect(result.components).not.toBe(input.components);
  });
});
