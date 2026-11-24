import { COMPONENT_LIMITS, COMPONENT_TYPES } from '../constants';
import type { ComponentHistoryDetails } from '../types';
import { validateComponentHistoryEntry } from '../utilities/validateComponentHistoryEntry';

const DETAILS: ComponentHistoryDetails = { date: '2026-04-12', installed: '2026-03-01', distance: 412.5 };

describe('validateComponentHistoryEntry', () => {
  it.each(COMPONENT_TYPES)('accepts a full entry on the type %s', (type) => {
    expect(validateComponentHistoryEntry(type, DETAILS)).toEqual([]);
  });

  it.each(['2026-02-28', '2026-03-01', '2026-03-02', '9999-12-31'])(
    'accepts the date %s for an installation on 2026-03-01',
    (date) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, date })).toEqual([]);
    },
  );

  describe.each<'date' | 'installed'>(['date', 'installed'])('%s', (field) => {
    it.each([
      ['', 'required'],
      ['2023-02-30', 'invalidFormat'],
      ['12.04.2026', 'invalidFormat'],
    ])('rejects %j as %s', (value, code) => {
      expect(validateComponentHistoryEntry('chain', { ...DETAILS, [field]: value })).toEqual([{ field, code }]);
    });
  });

  it.each([null, 0, 0.1, COMPONENT_LIMITS.distanceMax])('accepts the distance %s', (distance) => {
    expect(validateComponentHistoryEntry('chain', { ...DETAILS, distance })).toEqual([]);
  });

  it.each([
    [NaN, 'invalidFormat'],
    [Infinity, 'invalidFormat'],
    [-0.1, 'outOfRange'],
    [500_000.1, 'outOfRange'],
    [412.55, 'invalidFormat'],
  ])('rejects the distance %s as %s', (distance, code) => {
    expect(validateComponentHistoryEntry('chain', { ...DETAILS, distance })).toEqual([{ field: 'distance', code }]);
  });

  it('reports one error per failing field, in field order', () => {
    expect(validateComponentHistoryEntry('chain', { distance: -1, installed: '2023-02-30', date: '' })).toEqual([
      { field: 'date', code: 'required' },
      { field: 'installed', code: 'invalidFormat' },
      { field: 'distance', code: 'outOfRange' },
    ]);
  });
});
