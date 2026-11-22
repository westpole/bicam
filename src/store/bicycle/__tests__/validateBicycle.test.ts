import { BICYCLE_LIMITS } from '../constants';
import type { BicycleDetails } from '../types';
import { normalizeBicycleInput } from '../utilities/normalizeBicycleInput';
import { validateBicycle } from '../utilities/validateBicycle';

/**
 * Builds a valid, fully filled bicycle with optional overrides.
 *
 * @param overrides - Fields to replace.
 * @returns A normalized bicycle.
 */
function makeBicycle(overrides: Partial<BicycleDetails> = {}): BicycleDetails {
  return {
    name: 'Gravel Grinder',
    company: 'Canyon',
    model: 'Grizl CF SL 7',
    purchased: '2024-05-17',
    size: 'M',
    frameGeometry: 'Stack 594 mm\nReach 393 mm',
    components: ['chain-1', 'cassette-1'],
    ...overrides,
  };
}

const BELL = '\u0007';

describe('validateBicycle', () => {
  it('accepts a fully filled bicycle', () => {
    expect(validateBicycle(makeBicycle())).toEqual([]);
  });

  it('accepts a bicycle with only the required fields', () => {
    const bicycle = makeBicycle({ purchased: null, size: null, frameGeometry: null, components: [] });

    expect(validateBicycle(bicycle)).toEqual([]);
  });

  describe.each([
    ['name', BICYCLE_LIMITS.nameMaxLength],
    ['company', BICYCLE_LIMITS.companyMaxLength],
    ['model', BICYCLE_LIMITS.modelMaxLength],
  ] as const)('%s', (field, maxLength) => {
    it('is required', () => {
      expect(validateBicycle(makeBicycle({ [field]: '' }))).toEqual([{ field, code: 'required' }]);
    });

    it(`accepts exactly ${maxLength} characters`, () => {
      expect(validateBicycle(makeBicycle({ [field]: 'x'.repeat(maxLength) }))).toEqual([]);
    });

    it(`rejects more than ${maxLength} characters`, () => {
      expect(validateBicycle(makeBicycle({ [field]: 'x'.repeat(maxLength + 1) }))).toEqual([
        { field, code: 'tooLong' },
      ]);
    });

    it.each([
      ['a bell', `a${BELL}b`],
      ['a line break', 'a\nb'],
      ['a tab', 'a\tb'],
    ])('rejects %s', (_label, value) => {
      expect(validateBicycle(makeBicycle({ [field]: value }))).toEqual([{ field, code: 'invalidFormat' }]);
    });

    it('accepts non-ASCII text', () => {
      expect(validateBicycle(makeBicycle({ [field]: 'Vélo № 1 🚲' }))).toEqual([]);
    });
  });

  describe('purchased', () => {
    it.each(['2024-02-29', '1985-07-01'])('accepts %s', (purchased) => {
      expect(validateBicycle(makeBicycle({ purchased }))).toEqual([]);
    });

    it.each(['2023-02-29', '2023-02-30', '2023-13-01', '17.05.2024', '2024-05-17T00:00'])(
      'rejects %s',
      (purchased) => {
        expect(validateBicycle(makeBicycle({ purchased }))).toEqual([{ field: 'purchased', code: 'invalidFormat' }]);
      },
    );
  });

  describe('size', () => {
    it.each(['ML', 'M/L', 'XS', 'xl', '51', '56.5', 'S-M', 'M L', '1234567890'])('accepts %s', (size) => {
      expect(validateBicycle(makeBicycle({ size }))).toEqual([]);
    });

    it('rejects more than 10 characters', () => {
      expect(validateBicycle(makeBicycle({ size: '12345678901' }))).toEqual([{ field: 'size', code: 'tooLong' }]);
    });

    it.each(['X*L', '51cm!', 'M_L', 'Größe', 'M\tL'])('rejects %s', (size) => {
      expect(validateBicycle(makeBicycle({ size }))).toEqual([{ field: 'size', code: 'invalidFormat' }]);
    });
  });

  describe('frameGeometry', () => {
    it('accepts exactly 500 characters with line breaks', () => {
      const frameGeometry = `${'x'.repeat(249)}\r\n${'y'.repeat(249)}`;

      expect(validateBicycle(makeBicycle({ frameGeometry }))).toEqual([]);
    });

    it('rejects more than 500 characters', () => {
      expect(validateBicycle(makeBicycle({ frameGeometry: 'x'.repeat(501) }))).toEqual([
        { field: 'frameGeometry', code: 'tooLong' },
      ]);
    });

    it.each([
      ['a tab', 'Stack\t594'],
      ['a bell', `Stack${BELL}594`],
    ])('rejects %s', (_label, frameGeometry) => {
      expect(validateBicycle(makeBicycle({ frameGeometry }))).toEqual([
        { field: 'frameGeometry', code: 'invalidFormat' },
      ]);
    });
  });

  describe('components', () => {
    it('accepts exactly 100 ids of up to 64 characters', () => {
      const components = Array.from({ length: 100 }, (_, index) => `${index}`.padStart(64, 'c'));

      expect(validateBicycle(makeBicycle({ components }))).toEqual([]);
    });

    it('rejects more than 100 ids', () => {
      const components = Array.from({ length: 101 }, (_, index) => `c-${index}`);

      expect(validateBicycle(makeBicycle({ components }))).toEqual([{ field: 'components', code: 'tooMany' }]);
    });

    it.each([
      ['an empty id', ['chain-1', ''], 'required'],
      ['an id over 64 characters', ['x'.repeat(65)], 'tooLong'],
      ['an id with a control character', [`chain${BELL}1`], 'invalidFormat'],
      ['a repeated id', ['chain-1', 'cassette-1', 'chain-1'], 'duplicate'],
    ] as const)('rejects %s', (_label, components, code) => {
      expect(validateBicycle(makeBicycle({ components: [...components] }))).toEqual([{ field: 'components', code }]);
    });

    it('reports the first failing id rule only once', () => {
      expect(validateBicycle(makeBicycle({ components: ['', '', 'x'.repeat(65)] }))).toEqual([
        { field: 'components', code: 'required' },
      ]);
    });
  });

  it('applies limits after normalization trims the input', () => {
    const bicycle = normalizeBicycleInput({ name: `  ${'x'.repeat(40)}  `, company: 'Canyon', model: 'Ultimate' });

    expect(validateBicycle(bicycle)).toEqual([]);
  });

  it('reports every failing field once, in Bicycle field order', () => {
    const bicycle: BicycleDetails = {
      name: '',
      company: 'x'.repeat(61),
      model: `a${BELL}`,
      purchased: '2023-02-30',
      size: 'X*L',
      frameGeometry: 'x'.repeat(501),
      components: ['a', 'a'],
    };

    expect(validateBicycle(bicycle)).toEqual([
      { field: 'name', code: 'required' },
      { field: 'company', code: 'tooLong' },
      { field: 'model', code: 'invalidFormat' },
      { field: 'purchased', code: 'invalidFormat' },
      { field: 'size', code: 'invalidFormat' },
      { field: 'frameGeometry', code: 'tooLong' },
      { field: 'components', code: 'duplicate' },
    ]);
  });
});
