import type { ComponentCollection } from '../../components/types';
import { INITIAL_APP_STATE } from '../../constants';
import { useAppStore } from '../../useAppStore';
import { BICYCLE_LIMITS } from '../constants';
import type { Bicycle, BicycleDetails, BicycleErrorCode, BicycleInput, BicycleUpdate } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const GRAVEL_INPUT: BicycleInput = {
  name: ' Gravel Grinder ',
  company: 'Canyon',
  model: 'Grizl CF SL 7',
  purchased: '2024-05-17',
  size: 'M',
  frameGeometry: 'Stack 594 mm',
  components: ['chain-1'],
};

const GRAVEL_DETAILS: BicycleDetails = {
  name: 'Gravel Grinder',
  company: 'Canyon',
  model: 'Grizl CF SL 7',
  purchased: '2024-05-17',
  size: 'M',
  frameGeometry: 'Stack 594 mm',
  components: ['chain-1'],
};

/** Stored components that the bicycles under test may list. */
const COMPONENTS: ComponentCollection = {
  byId: {
    'chain-1': { id: 'chain-1', type: 'chain', model: 'CN-M8100', history: [] },
    'chain-2': { id: 'chain-2', type: 'chain', model: 'X12', history: [] },
    'cassette-1': { id: 'cassette-1', type: 'cassette', model: 'CS-M8100', history: [] },
  },
  allIds: ['chain-1', 'chain-2', 'cassette-1'],
};

/** Component lists with an unknown id that an earlier rule rejects, with that rule's code. */
const REJECTED_BEFORE_LOOKUP: Array<[string, string[], BicycleErrorCode]> = [
  ['too many ids', Array.from({ length: BICYCLE_LIMITS.componentsMaxCount + 1 }, (_, i) => `unknown-${i}`), 'tooMany'],
  ['a blank id', ['unknown-id', ' '], 'required'],
  ['a too long id', ['unknown-id', 'x'.repeat(BICYCLE_LIMITS.componentIdMaxLength + 1)], 'tooLong'],
  ['a control character', ['unknown-id', 'a\nb'], 'invalidFormat'],
  ['a repeated id', ['unknown-id', 'unknown-id'], 'duplicate'],
];

/**
 * Builds minimal valid input for a bicycle with the given name.
 *
 * @param name - The bicycle name.
 * @returns Input with only the required fields.
 */
function minimalInput(name: string): BicycleInput {
  return { name, company: 'Canyon', model: 'Ultimate' };
}

/**
 * Adds a bicycle and fails the test if the store rejects it.
 *
 * @param input - Valid bicycle input.
 * @returns The stored bicycle, including its generated id.
 */
function addOrFail(input: BicycleInput): Bicycle {
  const result = useAppStore.getState().addBicycle(input);

  if (!result.ok) {
    throw new Error(`Fixture rejected: ${JSON.stringify(result.errors)}`);
  }

  return result.bicycle;
}

describe('bicycle slice', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE, components: COMPONENTS });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addBicycle', () => {
    it('stores the normalized bicycle under a generated UUID and appends the id', () => {
      const result = useAppStore.getState().addBicycle(GRAVEL_INPUT);

      if (!result.ok) {
        throw new Error('expected success');
      }
      const { id } = result.bicycle;
      expect(id).toMatch(UUID_PATTERN);
      expect(result.bicycle).toEqual({ id, ...GRAVEL_DETAILS });
      expect(useAppStore.getState().bicycle).toEqual({ byId: { [id]: result.bicycle }, allIds: [id] });
    });

    it('uses crypto.randomUUID for the id', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('11111111-1111-4111-8111-111111111111');

      expect(addOrFail(minimalInput('Roadie')).id).toBe('11111111-1111-4111-8111-111111111111');
    });

    it('gives every bicycle a different id', () => {
      const ids = ['A', 'B', 'C'].map((name) => addOrFail(minimalInput(name)).id);

      expect(new Set(ids).size).toBe(3);
    });

    it('fills omitted optional fields with null and []', () => {
      expect(addOrFail(minimalInput('Roadie'))).toMatchObject({
        name: 'Roadie',
        company: 'Canyon',
        model: 'Ultimate',
        purchased: null,
        size: null,
        frameGeometry: null,
        components: [],
      });
    });

    it('keeps insertion order', () => {
      const ids = ['Zeta', '51', 'Alpha', '2024'].map((name) => addOrFail(minimalInput(name)).id);

      expect(useAppStore.getState().bicycle.allIds).toEqual(ids);
    });

    it('does not mutate the initial collection', () => {
      addOrFail(minimalInput('Roadie'));

      expect(INITIAL_APP_STATE.bicycle).toEqual({ byId: {}, allIds: [] });
    });

    it('ignores an id smuggled into the input', () => {
      const input = { ...minimalInput('Roadie'), id: 'chosen-id' } as BicycleInput;

      expect(addOrFail(input).id).toMatch(UUID_PATTERN);
    });

    it.each(['Roadie', 'roadie', 'ROADIE', '  Roadie  '])('rejects the name %j when "Roadie" exists', (name) => {
      addOrFail(minimalInput('Roadie'));
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().addBicycle(minimalInput(name));

      expect(result).toEqual({ ok: false, errors: [{ field: 'name', code: 'duplicate' }] });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('reports the duplicate name first, together with other field errors', () => {
      addOrFail(minimalInput('Roadie'));

      const result = useAppStore.getState().addBicycle({ name: 'roadie', company: '', model: 'Ultimate', size: 'X*L' });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'name', code: 'duplicate' },
          { field: 'company', code: 'required' },
          { field: 'size', code: 'invalidFormat' },
        ],
      });
    });

    it('returns validation errors, generates no id, and leaves state unchanged for invalid input', () => {
      const randomUUID = vi.spyOn(crypto, 'randomUUID');
      const before = useAppStore.getState().bicycle;

      const result = useAppStore
        .getState()
        .addBicycle({ name: ' ', company: 'Canyon', model: 'Ultimate', purchased: '2023-02-30' });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'name', code: 'required' },
          { field: 'purchased', code: 'invalidFormat' },
        ],
      });
      expect(randomUUID).not.toHaveBeenCalled();
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it.each([[[]], [['chain-1']], [[' chain-1 ', 'cassette-1']]])('accepts the stored components %j', (components) => {
      const expected = components.map((id: string) => id.trim());

      expect(addOrFail({ ...minimalInput('Roadie'), components }).components).toEqual(expected);
    });

    it('accepts a component that another bicycle lists', () => {
      addOrFail({ ...minimalInput('Roadie'), components: ['chain-1'] });

      expect(addOrFail({ ...minimalInput('Gravel'), components: ['chain-1'] }).components).toEqual(['chain-1']);
    });

    it.each(['unknown-id', 'CHAIN-1', 'toString', '__proto__'])('rejects the unknown component %j', (id) => {
      const randomUUID = vi.spyOn(crypto, 'randomUUID');
      const before = useAppStore.getState();

      const result = before.addBicycle({ ...minimalInput('Roadie'), components: ['chain-1', id] });

      expect(result).toEqual({ ok: false, errors: [{ field: 'components', code: 'notFound' }] });
      expect(randomUUID).not.toHaveBeenCalled();
      expect(useAppStore.getState()).toBe(before);
    });

    it.each(REJECTED_BEFORE_LOOKUP)('reports %s before an unknown component', (_name, components, code) => {
      const result = useAppStore.getState().addBicycle({ ...minimalInput('Roadie'), components });

      expect(result).toEqual({ ok: false, errors: [{ field: 'components', code }] });
    });

    it('reports an unknown component last, together with other field errors', () => {
      addOrFail(minimalInput('Roadie'));

      const result = useAppStore
        .getState()
        .addBicycle({ ...minimalInput('roadie'), size: 'X*L', components: ['unknown-id'] });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'name', code: 'duplicate' },
          { field: 'size', code: 'invalidFormat' },
          { field: 'components', code: 'notFound' },
        ],
      });
    });

    it.each(['toString', 'constructor', '__proto__'])('accepts %j as a name', (name) => {
      expect(addOrFail(minimalInput(name))).toMatchObject({ name });
    });
  });

  describe('updateBicycle', () => {
    let gravel: Bicycle;
    let roadie: Bicycle;

    beforeEach(() => {
      addOrFail({ name: 'First', company: 'Trek', model: 'Domane' });
      gravel = addOrFail(GRAVEL_INPUT);
      roadie = addOrFail({ name: 'Roadie', company: 'Giant', model: 'TCR' });
    });

    it('changes only the given keys, normalized, and keeps the id and position in allIds', () => {
      const allIdsBefore = useAppStore.getState().bicycle.allIds;

      const result = useAppStore.getState().updateBicycle(gravel.id, { model: '  Grizl CF SLX 8 ', size: 'ML' });

      const expected: Bicycle = { ...gravel, model: 'Grizl CF SLX 8', size: 'ML' };
      expect(result).toEqual({ ok: true, bicycle: expected });
      expect(useAppStore.getState().bicycle.byId[gravel.id]).toEqual(expected);
      expect(useAppStore.getState().bicycle.allIds).toBe(allIdsBefore);
    });

    it('renames a bicycle and keeps its id', () => {
      const result = useAppStore.getState().updateBicycle(gravel.id, { name: ' Mud Runner ' });

      expect(result).toEqual({ ok: true, bicycle: { ...gravel, name: 'Mud Runner' } });
      expect(useAppStore.getState().bicycle.byId[gravel.id].name).toBe('Mud Runner');
    });

    it("allows changing the case of the bicycle's own name", () => {
      const result = useAppStore.getState().updateBicycle(roadie.id, { name: 'ROADIE' });

      expect(result).toMatchObject({ ok: true, bicycle: { id: roadie.id, name: 'ROADIE' } });
    });

    it("rejects a rename to another bicycle's name, ignoring case", () => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().updateBicycle(gravel.id, { name: 'roadie' });

      expect(result).toEqual({ ok: false, errors: [{ field: 'name', code: 'duplicate' }] });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('frees the old name after a rename', () => {
      useAppStore.getState().updateBicycle(roadie.id, { name: 'Race Day' });

      expect(useAppStore.getState().addBicycle(minimalInput('Roadie')).ok).toBe(true);
    });

    it('clears optional fields set to null or blank', () => {
      const result = useAppStore
        .getState()
        .updateBicycle(gravel.id, { purchased: null, size: '  ', frameGeometry: null });

      expect(result).toMatchObject({ ok: true, bicycle: { purchased: null, size: null, frameGeometry: null } });
    });

    it('leaves omitted and undefined keys unchanged', () => {
      const result = useAppStore.getState().updateBicycle(gravel.id, { size: undefined, components: undefined });

      expect(result).toEqual({ ok: true, bicycle: gravel });
    });

    it('replaces the installed components list', () => {
      const result = useAppStore.getState().updateBicycle(gravel.id, { components: ['chain-2', 'cassette-1'] });

      expect(result).toMatchObject({ ok: true, bicycle: { components: ['chain-2', 'cassette-1'] } });
    });

    it('accepts an empty components list', () => {
      const result = useAppStore.getState().updateBicycle(gravel.id, { components: [] });

      expect(result).toEqual({ ok: true, bicycle: { ...gravel, components: [] } });
    });

    it.each(['unknown-id', 'CHAIN-1', 'toString', '__proto__'])('rejects the unknown component %j', (id) => {
      const before = useAppStore.getState();

      const result = before.updateBicycle(gravel.id, { components: ['chain-1', id] });

      expect(result).toEqual({ ok: false, errors: [{ field: 'components', code: 'notFound' }] });
      expect(useAppStore.getState()).toBe(before);
    });

    it.each(REJECTED_BEFORE_LOOKUP)('reports %s before an unknown component', (_name, components, code) => {
      const result = useAppStore.getState().updateBicycle(gravel.id, { components });

      expect(result).toEqual({ ok: false, errors: [{ field: 'components', code }] });
    });

    it('reports only the unknown bicycle when the components are unknown too', () => {
      const result = useAppStore.getState().updateBicycle('unknown-id', { components: ['unknown-id'] });

      expect(result).toEqual({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });
    });

    it('keeps the stored id even if the caller smuggles an id into the changes', () => {
      const changes = { id: 'other-id', model: 'Grizl 9' } as BicycleUpdate;

      const result = useAppStore.getState().updateBicycle(gravel.id, changes);

      expect(result).toMatchObject({ ok: true, bicycle: { id: gravel.id, model: 'Grizl 9' } });
      expect(Object.keys(useAppStore.getState().bicycle.byId)).not.toContain('other-id');
    });

    it.each(['unknown-id', 'Roadie', 'toString', '__proto__'])('returns notFound for %j', (id) => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().updateBicycle(id, { model: 'X' });

      expect(result).toEqual({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });
      expect(useAppStore.getState().bicycle).toBe(before);
    });

    it('returns validation errors and leaves state unchanged for invalid changes', () => {
      const before = useAppStore.getState().bicycle;

      const result = useAppStore.getState().updateBicycle(gravel.id, { company: ' ', components: ['a', 'a'] });

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
    let ids: string[];

    beforeEach(() => {
      ids = ['First', 'Roadie', 'Last'].map((name) => addOrFail(minimalInput(name)).id);
    });

    it('removes the bicycle from byId and allIds', () => {
      const [first, roadie, last] = ids;

      expect(useAppStore.getState().removeBicycle(roadie)).toBe(true);

      const { bicycle } = useAppStore.getState();
      expect(Object.keys(bicycle.byId)).toEqual([first, last]);
      expect(bicycle.allIds).toEqual([first, last]);
    });

    it('frees the name for a new bicycle', () => {
      useAppStore.getState().removeBicycle(ids[1]);

      expect(useAppStore.getState().addBicycle(minimalInput('roadie')).ok).toBe(true);
    });

    it.each(['Roadie', 'unknown-id', 'toString', '__proto__'])('returns false and changes nothing for %j', (id) => {
      const before = useAppStore.getState().bicycle;

      expect(useAppStore.getState().removeBicycle(id)).toBe(false);
      expect(useAppStore.getState().bicycle).toBe(before);
    });
  });

  it('reset() clears all bicycles', () => {
    addOrFail(GRAVEL_INPUT);

    useAppStore.getState().reset();

    expect(useAppStore.getState().bicycle).toEqual({ byId: {}, allIds: [] });
  });
});
