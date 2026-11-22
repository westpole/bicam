import { INITIAL_APP_STATE } from '../../constants';
import { useAppStore } from '../../useAppStore';
import type { Bicycle, BicycleInput, BicycleUpdate } from '../types';

const GRAVEL_INPUT: BicycleInput = {
  id: ' Gravel Grinder ',
  company: 'Canyon',
  model: 'Grizl CF SL 7',
  purchased: '2024-05-17',
  size: 'M',
  frameGeometry: 'Stack 594 mm',
  components: ['chain-1'],
};

const GRAVEL: Bicycle = {
  id: 'Gravel Grinder',
  company: 'Canyon',
  model: 'Grizl CF SL 7',
  purchased: '2024-05-17',
  size: 'M',
  frameGeometry: 'Stack 594 mm',
  components: ['chain-1'],
};

/**
 * Builds minimal valid input for a bicycle with the given id.
 *
 * @param id - The bicycle id.
 * @returns Input with only the required fields.
 */
function minimalInput(id: string): BicycleInput {
  return { id, company: 'Canyon', model: 'Ultimate' };
}

/**
 * Adds a bicycle and fails the test if the store rejects it.
 *
 * @param input - Valid bicycle input.
 */
function addOrFail(input: BicycleInput): void {
  const result = useAppStore.getState().addBicycle(input);

  if (!result.ok) {
    throw new Error(`Fixture rejected: ${JSON.stringify(result.errors)}`);
  }
}

describe('bicycle slice', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  describe('addBicycle', () => {
    it('stores the normalized bicycle and appends its id', () => {
      const result = useAppStore.getState().addBicycle(GRAVEL_INPUT);

      expect(result).toEqual({ ok: true, bicycle: GRAVEL });
      expect(useAppStore.getState().bicycle).toEqual({
        byId: { 'Gravel Grinder': GRAVEL },
        allIds: ['Gravel Grinder'],
      });
    });

    it('fills omitted optional fields with null and []', () => {
      const result = useAppStore.getState().addBicycle(minimalInput('Roadie'));

      expect(result).toEqual({
        ok: true,
        bicycle: {
          id: 'Roadie',
          company: 'Canyon',
          model: 'Ultimate',
          purchased: null,
          size: null,
          frameGeometry: null,
          components: [],
        },
      });
    });

    it('keeps insertion order, including integer-like ids', () => {
      ['Zeta', '51', 'Alpha', '2024'].forEach((id) => addOrFail(minimalInput(id)));

      expect(useAppStore.getState().bicycle.allIds).toEqual(['Zeta', '51', 'Alpha', '2024']);
    });

    it('does not mutate the initial collection', () => {
      addOrFail(minimalInput('Roadie'));

      expect(INITIAL_APP_STATE.bicycle).toEqual({ byId: {}, allIds: [] });
    });

    it.each(['Roadie', 'roadie', 'ROADIE', '  Roadie  '])('rejects %j when "Roadie" exists', (id) => {
      addOrFail(minimalInput('Roadie'));
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().addBicycle(minimalInput(id));

      expect(result).toEqual({ ok: false, errors: [{ field: 'id', code: 'duplicate' }] });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('reports the duplicate id first, together with other field errors', () => {
      addOrFail(minimalInput('Roadie'));

      const result = useAppStore.getState().addBicycle({ id: 'roadie', company: '', model: 'Ultimate', size: 'X*L' });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'id', code: 'duplicate' },
          { field: 'company', code: 'required' },
          { field: 'size', code: 'invalidFormat' },
        ],
      });
    });

    it('returns validation errors and leaves state unchanged for invalid input', () => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore
        .getState()
        .addBicycle({ id: ' ', company: 'Canyon', model: 'Ultimate', purchased: '2023-02-30' });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'id', code: 'required' },
          { field: 'purchased', code: 'invalidFormat' },
        ],
      });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it.each(['toString', 'constructor', '__proto__', 'hasOwnProperty'])(
      'stores %j as an own key, not an inherited property',
      (id) => {
        addOrFail(minimalInput(id));

        const { bicycle } = useAppStore.getState();
        expect(Object.prototype.hasOwnProperty.call(bicycle.byId, id)).toBe(true);
        expect(bicycle.byId[id]).toMatchObject({ id });
        expect(Object.getPrototypeOf(bicycle.byId)).toBe(Object.prototype);
        expect(bicycle.allIds).toEqual([id]);
      },
    );
  });

  describe('updateBicycle', () => {
    beforeEach(() => {
      addOrFail({ id: 'First', company: 'Trek', model: 'Domane' });
      addOrFail(GRAVEL_INPUT);
      addOrFail({ id: 'Last', company: 'Giant', model: 'TCR' });
    });

    it('changes only the given keys, normalized, and keeps the position in allIds', () => {
      const allIdsBefore = useAppStore.getState().bicycle.allIds;

      const result = useAppStore.getState().updateBicycle('Gravel Grinder', { model: '  Grizl CF SLX 8 ', size: 'ML' });

      const expected: Bicycle = { ...GRAVEL, model: 'Grizl CF SLX 8', size: 'ML' };
      expect(result).toEqual({ ok: true, bicycle: expected });
      expect(useAppStore.getState().bicycle.byId['Gravel Grinder']).toEqual(expected);
      expect(useAppStore.getState().bicycle.allIds).toBe(allIdsBefore);
      expect(useAppStore.getState().bicycle.allIds).toEqual(['First', 'Gravel Grinder', 'Last']);
    });

    it('clears optional fields set to null or blank', () => {
      const result = useAppStore
        .getState()
        .updateBicycle('Gravel Grinder', { purchased: null, size: '  ', frameGeometry: null });

      expect(result).toMatchObject({ ok: true, bicycle: { purchased: null, size: null, frameGeometry: null } });
    });

    it('leaves omitted and undefined keys unchanged', () => {
      const result = useAppStore.getState().updateBicycle('Gravel Grinder', { size: undefined, components: undefined });

      expect(result).toEqual({ ok: true, bicycle: GRAVEL });
    });

    it('replaces the installed components list', () => {
      const result = useAppStore.getState().updateBicycle('Gravel Grinder', { components: ['chain-2', 'cassette-1'] });

      expect(result).toMatchObject({ ok: true, bicycle: { components: ['chain-2', 'cassette-1'] } });
    });

    it('keeps the stored id even if the caller smuggles an id into the changes', () => {
      const changes = { id: 'Renamed', model: 'Grizl 9' } as BicycleUpdate;

      useAppStore.getState().updateBicycle('Gravel Grinder', changes);

      const { bicycle } = useAppStore.getState();
      expect(bicycle.byId['Gravel Grinder']).toMatchObject({ id: 'Gravel Grinder', model: 'Grizl 9' });
      expect(Object.prototype.hasOwnProperty.call(bicycle.byId, 'Renamed')).toBe(false);
    });

    it.each(['Unknown', 'gravel grinder', 'toString', '__proto__'])('returns notFound for %j', (id) => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().updateBicycle(id, { model: 'X' });

      expect(result).toEqual({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('returns validation errors and leaves state unchanged for invalid changes', () => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().updateBicycle('Gravel Grinder', { company: ' ', components: ['a', 'a'] });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'company', code: 'required' },
          { field: 'components', code: 'duplicate' },
        ],
      });
      expect(useAppStore.getState().bicycle).toBe(before);
    });
  });

  describe('removeBicycle', () => {
    beforeEach(() => {
      ['First', 'Roadie', 'Last'].forEach((id) => addOrFail(minimalInput(id)));
    });

    it('removes the bicycle from byId and allIds', () => {
      expect(useAppStore.getState().removeBicycle('Roadie')).toBe(true);

      const { bicycle } = useAppStore.getState();
      expect(Object.keys(bicycle.byId)).toEqual(['First', 'Last']);
      expect(bicycle.allIds).toEqual(['First', 'Last']);
    });

    it('frees the id for a new bicycle', () => {
      useAppStore.getState().removeBicycle('Roadie');

      expect(useAppStore.getState().addBicycle(minimalInput('roadie')).ok).toBe(true);
    });

    it.each(['roadie', 'Unknown', 'toString', '__proto__'])('returns false and changes nothing for %j', (id) => {
      const before = useAppStore.getState().bicycle;

      expect(useAppStore.getState().removeBicycle(id)).toBe(false);
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('removes a bicycle stored under an Object.prototype name', () => {
      addOrFail(minimalInput('constructor'));

      expect(useAppStore.getState().removeBicycle('constructor')).toBe(true);
      expect(useAppStore.getState().bicycle.allIds).toEqual(['First', 'Roadie', 'Last']);
    });
  });

  it('reset() clears all bicycles', () => {
    addOrFail(GRAVEL_INPUT);

    useAppStore.getState().reset();

    expect(useAppStore.getState().bicycle).toEqual({ byId: {}, allIds: [] });
  });
});
