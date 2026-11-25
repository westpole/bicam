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
  lubricated: null,
  stretch: null,
  lubricant: null,
  cleaned: null,
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

const TYPES_WITHOUT_CHAIN_CARE = COMPONENT_TYPES.filter((type) => type !== 'chain');

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
    [1_000_000.1, 'outOfRange'],
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

    it('covers the 14 types without a position', () => {
      expect(TYPES_WITHOUT_POSITION).toHaveLength(14);
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

    it('covers the 14 types without subcomponents', () => {
      expect(TYPES_WITHOUT_SUBCOMPONENT).toHaveLength(14);
    });

    describe.each(TYPES_WITHOUT_SUBCOMPONENT)('on %s', (type) => {
      it.each([...ALL_SUBCOMPONENTS, 'saddle'])('rejects %s as notAllowed', (subcomponent) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, subcomponent })).toEqual(
          failure('subcomponent', 'notAllowed'),
        );
      });
    });
  });

  describe('lubricated', () => {
    it.each(['2026-02-01', '2026-03-01', '2026-05-01', '2024-02-29'])(
      'accepts %s on a chain installed on 2026-03-01',
      (lubricated) => {
        const details = { ...DETAILS, lubricated };

        expect(validateComponentHistoryEntry('chain', details)).toStrictEqual({ ok: true, details });
      },
    );

    it.each(['', '2023-02-29', '2026-4-12', '12.04.2026', 'yesterday'])(
      'rejects %j on a chain as invalidFormat',
      (lubricated) => {
        expect(validateComponentHistoryEntry('chain', { ...DETAILS, lubricated })).toEqual(
          failure('lubricated', 'invalidFormat'),
        );
      },
    );

    describe.each(TYPES_WITHOUT_CHAIN_CARE)('on %s', (type) => {
      it.each(['2026-04-12', 'yesterday'])('rejects %s as notAllowed', (lubricated) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, lubricated })).toEqual(
          failure('lubricated', 'notAllowed'),
        );
      });
    });
  });

  describe('stretch', () => {
    it.each([0, 0.01, 0.29, 0.5, 0.75, 5])('accepts %s on a chain', (stretch) => {
      const details = { ...DETAILS, stretch };

      expect(validateComponentHistoryEntry('chain', details)).toStrictEqual({ ok: true, details });
    });

    it.each<[number, ComponentErrorCode]>([
      [-0.01, 'outOfRange'],
      [5.01, 'outOfRange'],
      [NaN, 'invalidFormat'],
      [Infinity, 'invalidFormat'],
      [-Infinity, 'invalidFormat'],
      [0.755, 'invalidFormat'],
    ])('rejects %s on a chain as %s', (stretch, code) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, stretch })).toEqual(failure('stretch', code));
    });

    describe.each(TYPES_WITHOUT_CHAIN_CARE)('on %s', (type) => {
      it.each([0, 0.5, -1, NaN])('rejects %s as notAllowed', (stretch) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, stretch })).toEqual(failure('stretch', 'notAllowed'));
      });
    });
  });

  describe('lubricant', () => {
    const LUBRICATED = { ...DETAILS, lubricated: '2026-04-12' };

    it.each(['oil', 'wax'] as const)('accepts %s on a lubricated chain', (lubricant) => {
      const details = { ...LUBRICATED, lubricant };

      expect(validateComponentHistoryEntry('chain', details)).toStrictEqual({ ok: true, details });
    });

    it('accepts a lubrication without a lubricant, as unknown', () => {
      expect(validateComponentHistoryEntry('chain', LUBRICATED)).toStrictEqual({ ok: true, details: LUBRICATED });
    });

    it.each(['grease', 'Oil', 'WAX', ''])('rejects %j as invalidOption', (lubricant) => {
      expect(validateComponentHistoryEntry('chain', { ...LUBRICATED, lubricant })).toEqual(
        failure('lubricant', 'invalidOption'),
      );
    });

    it('rejects an unknown lubricant as invalidOption also without lubricated', () => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, lubricant: 'grease' })).toEqual(
        failure('lubricant', 'invalidOption'),
      );
    });

    it('rejects a lubricant without lubricated as notAllowed', () => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, lubricant: 'wax' })).toEqual(
        failure('lubricant', 'notAllowed'),
      );
    });

    describe.each(TYPES_WITHOUT_CHAIN_CARE)('on %s', (type) => {
      it.each(['oil', 'grease'])('rejects %s as notAllowed', (lubricant) => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, lubricant })).toEqual(
          failure('lubricant', 'notAllowed'),
        );
      });
    });
  });

  describe('cleaned', () => {
    it('accepts a clean on the day of the lubrication', () => {
      const details = { ...DETAILS, lubricated: '2026-04-12', lubricant: 'wax' as const, cleaned: '2026-04-12' };

      expect(validateComponentHistoryEntry('chain', details)).toStrictEqual({ ok: true, details });
    });

    it.each(['2023-02-29', '2026-4-12', 'yesterday'])('rejects %j as invalidFormat', (cleaned) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, lubricated: '2026-04-12', cleaned })).toEqual(
        failure('cleaned', 'invalidFormat'),
      );
    });

    it('makes lubricated required, because a cleaned chain is relubricated', () => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, cleaned: '2026-04-12' })).toEqual(
        failure('lubricated', 'required'),
      );
    });

    it('rejects a date other than lubricated as notAllowed', () => {
      expect(
        validateComponentHistoryEntry('chain', { ...DETAILS, lubricated: '2026-04-12', cleaned: '2026-04-11' }),
      ).toEqual(failure('cleaned', 'notAllowed'));
    });

    it('reports only an invalid lubricated, not a mismatch with it', () => {
      expect(
        validateComponentHistoryEntry('chain', { ...DETAILS, lubricated: '2026-02-30', cleaned: '2026-04-12' }),
      ).toEqual(failure('lubricated', 'invalidFormat'));
    });

    it('does not ask for lubricated when cleaned itself is invalid', () => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, cleaned: 'yesterday' })).toEqual(
        failure('cleaned', 'invalidFormat'),
      );
    });

    describe.each(TYPES_WITHOUT_CHAIN_CARE)('on %s', (type) => {
      it('rejects a date as notAllowed and does not ask for lubricated', () => {
        expect(validateComponentHistoryEntry(type, { ...DETAILS, cleaned: '2026-04-12' })).toEqual(
          failure('cleaned', 'notAllowed'),
        );
      });
    });
  });

  it('covers the 16 types without chain care', () => {
    expect(TYPES_WITHOUT_CHAIN_CARE).toHaveLength(16);
  });

  it('reports one error per failing field, in field order', () => {
    expect(
      validateComponentHistoryEntry('wheel', {
        cleaned: '2026-04-12',
        lubricant: 'oil',
        stretch: 0,
        lubricated: '2026-04-12',
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
        { field: 'lubricated', code: 'notAllowed' },
        { field: 'stretch', code: 'notAllowed' },
        { field: 'lubricant', code: 'notAllowed' },
        { field: 'cleaned', code: 'notAllowed' },
      ],
    });
  });
});
