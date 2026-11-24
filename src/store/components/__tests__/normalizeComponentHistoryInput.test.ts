import type { ComponentHistoryInput, NormalizedComponentHistoryInput } from '../types';
import { normalizeComponentHistoryInput } from '../utilities/normalizeComponentHistoryInput';

const INPUT: ComponentHistoryInput = { date: '2026-04-12', installed: '2026-03-01' };

const NORMALIZED: NormalizedComponentHistoryInput = {
  date: '2026-04-12',
  installed: '2026-03-01',
  distance: null,
  position: null,
  subcomponent: null,
  lubricated: null,
  stretch: null,
};

describe('normalizeComponentHistoryInput', () => {
  it('trims the dates', () => {
    const input: ComponentHistoryInput = { date: ' 2026-04-12 ', installed: '\t2026-03-01\n', distance: 1 };

    expect(normalizeComponentHistoryInput(input)).toEqual({ ...NORMALIZED, distance: 1 });
  });

  it('keeps blank dates as empty strings so validation can report them', () => {
    expect(normalizeComponentHistoryInput({ date: '  ', installed: '' })).toMatchObject({ date: '', installed: '' });
  });

  describe.each<'distance' | 'stretch'>(['distance', 'stretch'])('%s', (field) => {
    it.each([
      ['missing', INPUT],
      ['undefined', { ...INPUT, [field]: undefined }],
      ['null', { ...INPUT, [field]: null }],
    ])('becomes null when %s', (_name, input) => {
      expect(normalizeComponentHistoryInput(input)).toStrictEqual(NORMALIZED);
    });

    // toBe uses Object.is, which tells 0 from -0.
    it.each([
      [0, 0],
      [-0, 0],
      [0.75, 0.75],
      [412.5, 412.5],
      [-1, -1],
      [NaN, NaN],
      [Infinity, Infinity],
    ])('turns %s into %s', (value, expected) => {
      expect(normalizeComponentHistoryInput({ ...INPUT, [field]: value })[field]).toBe(expected);
    });
  });

  describe.each(['position', 'subcomponent', 'lubricated'] as const)('%s', (field) => {
    it.each([
      ['missing', INPUT],
      ['undefined', { ...INPUT, [field]: undefined }],
      ['null', { ...INPUT, [field]: null }],
      ['empty', { ...INPUT, [field]: '' }],
      ['blank', { ...INPUT, [field]: ' \t' }],
    ])('becomes null when %s', (_name, input) => {
      expect(normalizeComponentHistoryInput(input)).toStrictEqual(NORMALIZED);
    });

    it.each([
      [' front ', 'front'],
      ['\tbrakePads\n', 'brakePads'],
      [' Unknown', 'Unknown'],
    ])('is trimmed from %j to %j without being validated', (value, expected) => {
      expect(normalizeComponentHistoryInput({ ...INPUT, [field]: value })).toStrictEqual({
        ...NORMALIZED,
        [field]: expected,
      });
    });
  });

  it('picks known fields only', () => {
    const input = { ...INPUT, distance: 1, id: 'chosen-id', extra: true };

    expect(normalizeComponentHistoryInput(input)).toStrictEqual({ ...NORMALIZED, distance: 1 });
  });

  it('does not mutate the input', () => {
    const input: ComponentHistoryInput = {
      date: ' 2026-04-12 ',
      installed: ' 2026-03-01 ',
      distance: -0,
      position: ' rear ',
      subcomponent: ' ',
      lubricated: ' 2026-04-12 ',
      stretch: -0,
    };
    const snapshot = structuredClone(input);

    normalizeComponentHistoryInput(input);

    expect(input).toStrictEqual(snapshot);
  });
});
