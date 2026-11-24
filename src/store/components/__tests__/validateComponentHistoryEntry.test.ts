import { COMPONENT_LIMITS, COMPONENT_TYPES } from '../constants';
import type {
  BicycleComponentType,
  ComponentErrorCode,
  ComponentHistoryDetails,
  ComponentHistoryField,
  ComponentHistoryValidation,
  ComponentPosition,
  Subcomponent,
} from '../types';
import { validateComponentHistoryEntry } from '../utilities/validateComponentHistoryEntry';

const DETAILS: ComponentHistoryDetails = {
  date: '2026-04-12',
  installed: '2026-03-01',
  distance: 412.5,
  position: null,
  subcomponent: null,
};

const POSITIONS: ComponentPosition[] = ['front', 'rear'];

/** The `position` column of `docs/store/components.md` §3, written out so a wrong constant fails. */
const TYPES_WITH_POSITION: BicycleComponentType[] = ['brakes', 'shifters', 'derailleur'];

/** The `subcomponent` column of `docs/store/components.md` §3, written out so a wrong constant fails. */
const SUBCOMPONENT_TABLE: Array<[BicycleComponentType, Subcomponent[]]> = [
  ['wheel', ['hub', 'spokes', 'rim', 'valve']],
  ['brakes', ['lever', 'hose', 'caliper', 'rotor', 'brakePads', 'brakeFluid']],
  ['shifters', ['shifter', 'hose', 'cable', 'derailleur']],
];

const ALL_SUBCOMPONENTS = [...new Set(SUBCOMPONENT_TABLE.flatMap(([, subcomponents]) => subcomponents))];

const TYPES_WITHOUT_POSITION = COMPONENT_TYPES.filter((type) => !TYPES_WITH_POSITION.includes(type));

const TYPES_WITHOUT_SUBCOMPONENT = COMPONENT_TYPES.filter(
  (type) => !SUBCOMPONENT_TABLE.some(([listed]) => listed === type),
);

/**
 * Builds the expected result for one failing field.
 *
 * @param field - The failing field.
 * @param code - Its error code.
 * @returns The failed validation.
 */
function failure(field: ComponentHistoryField, code: ComponentErrorCode): ComponentHistoryValidation {
  return { ok: false, errors: [{ field, code }] };
}

describe('validateComponentHistoryEntry', () => {
  it.each(COMPONENT_TYPES)('accepts an entry without type-specific fields on the type %s', (type) => {
    expect(validateComponentHistoryEntry(type, DETAILS)).toStrictEqual({ ok: true, details: DETAILS });
  });

  it('returns only the details of a stored entry', () => {
    const entry = { ...DETAILS, id: 'entry-1' };

    expect(validateComponentHistoryEntry('chain', entry)).toStrictEqual({ ok: true, details: DETAILS });
  });

  it.each(['2026-02-28', '2026-03-01', '2026-03-02', '9999-12-31'])(
    'accepts the date %s for an installation on 2026-03-01',
    (date) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, date }).ok).toBe(true);
    },
  );

  describe.each<'date' | 'installed'>(['date', 'installed'])('%s', (field) => {
    it.each<[string, ComponentErrorCode]>([
      ['', 'required'],
      ['2023-02-30', 'invalidFormat'],
      ['12.04.2026', 'invalidFormat'],
    ])('rejects %j as %s', (value, code) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, [field]: value })).toEqual(failure(field, code));
    });
  });

  it.each([null, 0, 0.1, COMPONENT_LIMITS.distanceMax])('accepts the distance %s', (distance) => {
    expect(validateComponentHistoryEntry('chain', { ...DETAILS, distance }).ok).toBe(true);
  });

  it.each<[number, ComponentErrorCode]>([
    [NaN, 'invalidFormat'],
    [Infinity, 'invalidFormat'],
    [-0.1, 'outOfRange'],
    [500_000.1, 'outOfRange'],
    [412.55, 'invalidFormat'],
  ])('rejects the distance %s as %s', (distance, code) => {
    expect(validateComponentHistoryEntry('chain', { ...DETAILS, distance })).toEqual(failure('distance', code));
  });

  describe('position', () => {
    describe.each(TYPES_WITH_POSITION)('on %s', (type) => {
      it.each(POSITIONS)('accepts %s', (position) => {
        const details = { ...DETAILS, position };

        expect(validateComponentHistoryEntry(type, details)).toStrictEqual({ ok: true, details });
      });

      it.each(['left', 'Front', 'toString'])('rejects %s as invalidOption', (position) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, position })).toEqual(
          failure('position', 'invalidOption'),
        );
      });
    });

    it('covers the 13 types without a position', () => {
      expect(TYPES_WITHOUT_POSITION).toHaveLength(13);
    });

    describe.each(TYPES_WITHOUT_POSITION)('on %s', (type) => {
      it.each([...POSITIONS, 'left'])('rejects %s as notAllowed', (position) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, position })).toEqual(
          failure('position', 'notAllowed'),
        );
      });
    });
  });

  describe('subcomponent', () => {
    describe.each(SUBCOMPONENT_TABLE)('on %s', (type, allowed) => {
      it.each(allowed)('accepts %s', (subcomponent) => {
        const details = { ...DETAILS, subcomponent };

        expect(validateComponentHistoryEntry(type, details)).toStrictEqual({ ok: true, details });
      });

      it.each([
        ...ALL_SUBCOMPONENTS.filter((subcomponent) => !allowed.includes(subcomponent)),
        'saddle',
        'Hose',
        'toString',
      ])('rejects %s as invalidOption', (subcomponent) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, subcomponent })).toEqual(
          failure('subcomponent', 'invalidOption'),
        );
      });
    });

    it('covers the 13 types without subcomponents', () => {
      expect(TYPES_WITHOUT_SUBCOMPONENT).toHaveLength(13);
    });

    describe.each(TYPES_WITHOUT_SUBCOMPONENT)('on %s', (type) => {
      it.each([...ALL_SUBCOMPONENTS, 'saddle'])('rejects %s as notAllowed', (subcomponent) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, subcomponent })).toEqual(
          failure('subcomponent', 'notAllowed'),
        );
      });
    });
  });

  it('reports one error per failing field, in field order', () => {
    expect(
      validateComponentHistoryEntry('wheel', {
        subcomponent: 'rotor',
        position: 'rear',
        distance: -1,
        installed: '2023-02-30',
        date: '',
      }),
    ).toEqual({
      ok: false,
      errors: [
        { field: 'date', code: 'required' },
        { field: 'installed', code: 'invalidFormat' },
        { field: 'distance', code: 'outOfRange' },
        { field: 'position', code: 'notAllowed' },
        { field: 'subcomponent', code: 'invalidOption' },
      ],
    });
  });
});
