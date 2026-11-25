import { COMPONENT_LIMITS, COMPONENT_TYPES, EMPTY_COMPONENT_LIMITS } from '../constants';
import type { ComponentErrorCode, ComponentField, ComponentValidation, NormalizedComponentInput } from '../types';
import { validateComponent } from '../utilities/validateComponent';

const CHAIN: NormalizedComponentInput = {
  type: 'chain',
  model: 'CN-M8100',
  label: null,
  initialDistance: 0,
  limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 },
};

const TIRE: NormalizedComponentInput = { ...CHAIN, type: 'tire', model: 'GP5000', limits: EMPTY_COMPONENT_LIMITS };

/**
 * Builds the expected result for one failing field.
 *
 * @param field - The failing field.
 * @param code - Its error code.
 * @returns The failed validation.
 */
function failure(field: ComponentField, code: ComponentErrorCode): ComponentValidation {
  return { ok: false, errors: [{ field, code }] };
}

describe('validateComponent', () => {
  it.each(COMPONENT_TYPES)('accepts the type %s without limits', (type) => {
    const input = { ...TIRE, type };

    expect(validateComponent(input)).toEqual({ ok: true, details: input });
  });

  it('accepts complete chain details and returns a copy of the limits', () => {
    const result = validateComponent({ ...CHAIN, label: 'A', initialDistance: 412.5 });

    expect(result).toEqual({ ok: true, details: { ...CHAIN, label: 'A', initialDistance: 412.5 } });
    expect(result.ok && result.details.limits).not.toBe(CHAIN.limits);
  });

  it('requires a type', () => {
    expect(validateComponent({ ...CHAIN, type: '' })).toEqual(failure('type', 'required'));
  });

  it.each(['Chain', 'bar tape', 'engine', 'toString', '__proto__', '0', 'length'])('rejects the type %j', (type) => {
    expect(validateComponent({ ...TIRE, type })).toEqual(failure('type', 'invalidOption'));
  });

  it('accepts a model of exactly the maximum length', () => {
    const model = 'x'.repeat(COMPONENT_LIMITS.modelMaxLength);

    expect(validateComponent({ ...CHAIN, model }).ok).toBe(true);
  });

  it.each([
    ['a blank', '', 'required'],
    ['a too long', 'x'.repeat(COMPONENT_LIMITS.modelMaxLength + 1), 'tooLong'],
    ['a multi-line', 'a\nb', 'invalidFormat'],
    ['a bell-containing', 'a\u0007b', 'invalidFormat'],
  ] as const)('rejects %s model', (_description, model, code) => {
    expect(validateComponent({ ...CHAIN, model })).toEqual(failure('model', code));
  });

  describe('label', () => {
    it.each(['A', 'red link', 'x'.repeat(COMPONENT_LIMITS.labelMaxLength)])('accepts %j', (label) => {
      expect(validateComponent({ ...CHAIN, label }).ok).toBe(true);
    });

    it.each([
      ['a too long', 'x'.repeat(COMPONENT_LIMITS.labelMaxLength + 1), 'tooLong'],
      ['a multi-line', 'A\nB', 'invalidFormat'],
    ] as const)('rejects %s label', (_description, label, code) => {
      expect(validateComponent({ ...CHAIN, label })).toEqual(failure('label', code));
    });
  });

  describe('initialDistance', () => {
    it.each([0, 0.1, 412.5, COMPONENT_LIMITS.initialDistanceMax])('accepts %s', (initialDistance) => {
      expect(validateComponent({ ...CHAIN, initialDistance }).ok).toBe(true);
    });

    it.each<[number, ComponentErrorCode]>([
      [-0.1, 'outOfRange'],
      [COMPONENT_LIMITS.initialDistanceMax + 0.1, 'outOfRange'],
      [412.55, 'invalidFormat'],
      [NaN, 'invalidFormat'],
      [Infinity, 'invalidFormat'],
    ])('rejects %s as %s', (initialDistance, code) => {
      expect(validateComponent({ ...CHAIN, initialDistance })).toEqual(failure('initialDistance', code));
    });
  });

  describe('limits', () => {
    it.each(['distance', 'lubrication', 'cleaning'] as const)('accepts limits.%s from 0.1 to 500 000', (key) => {
      for (const value of [0.1, 300, COMPONENT_LIMITS.limitDistanceMax, null]) {
        expect(validateComponent({ ...CHAIN, limits: { ...CHAIN.limits, [key]: value } }).ok).toBe(true);
      }
    });

    it.each(['distance', 'lubrication', 'cleaning'] as const)('rejects bad values of limits.%s', (key) => {
      const cases: Array<[number, ComponentErrorCode]> = [
        [0, 'outOfRange'],
        [-1, 'outOfRange'],
        [COMPONENT_LIMITS.limitDistanceMax + 0.1, 'outOfRange'],
        [300.55, 'invalidFormat'],
        [NaN, 'invalidFormat'],
      ];

      for (const [value, code] of cases) {
        expect(validateComponent({ ...CHAIN, limits: { ...CHAIN.limits, [key]: value } })).toEqual(
          failure(`limits.${key}`, code),
        );
      }
    });

    it.each([0.01, 0.75, 5, null])('accepts the stretch limit %s', (stretch) => {
      expect(validateComponent({ ...CHAIN, limits: { ...CHAIN.limits, stretch } }).ok).toBe(true);
    });

    it.each<[number, ComponentErrorCode]>([
      [0, 'outOfRange'],
      [5.01, 'outOfRange'],
      [0.755, 'invalidFormat'],
    ])('rejects the stretch limit %s as %s', (stretch, code) => {
      expect(validateComponent({ ...CHAIN, limits: { ...CHAIN.limits, stretch } })).toEqual(
        failure('limits.stretch', code),
      );
    });

    it('accepts a replacement distance on any type', () => {
      expect(validateComponent({ ...TIRE, limits: { ...EMPTY_COMPONENT_LIMITS, distance: 4000 } }).ok).toBe(true);
    });

    it.each(COMPONENT_TYPES.filter((type) => type !== 'chain'))('rejects chain-only limits on %s', (type) => {
      expect(validateComponent({ ...CHAIN, type })).toEqual({
        ok: false,
        errors: [
          { field: 'limits.stretch', code: 'notAllowed' },
          { field: 'limits.lubrication', code: 'notAllowed' },
          { field: 'limits.cleaning', code: 'notAllowed' },
        ],
      });
    });

    it('checks notAllowed before the number rules', () => {
      expect(validateComponent({ ...TIRE, limits: { ...EMPTY_COMPONENT_LIMITS, stretch: -1 } })).toEqual(
        failure('limits.stretch', 'notAllowed'),
      );
    });

    it('checks only the numbers of chain-only limits when the type is unknown', () => {
      expect(validateComponent({ ...CHAIN, type: 'engine', limits: { ...CHAIN.limits, cleaning: 0 } })).toEqual({
        ok: false,
        errors: [
          { field: 'type', code: 'invalidOption' },
          { field: 'limits.cleaning', code: 'outOfRange' },
        ],
      });
    });
  });

  it('reports every failing field once, in field order', () => {
    expect(
      validateComponent({
        type: 'engine',
        model: '',
        label: 'x'.repeat(21),
        initialDistance: -1,
        limits: { distance: 0, stretch: 9, lubrication: 0.01, cleaning: NaN },
      }),
    ).toEqual({
      ok: false,
      errors: [
        { field: 'type', code: 'invalidOption' },
        { field: 'model', code: 'required' },
        { field: 'label', code: 'tooLong' },
        { field: 'initialDistance', code: 'outOfRange' },
        { field: 'limits.distance', code: 'outOfRange' },
        { field: 'limits.stretch', code: 'outOfRange' },
        { field: 'limits.lubrication', code: 'invalidFormat' },
        { field: 'limits.cleaning', code: 'invalidFormat' },
      ],
    });
  });
});
