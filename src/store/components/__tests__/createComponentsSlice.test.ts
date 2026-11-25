import { INITIAL_APP_STATE } from '../../constants';
import { useAppStore } from '../../useAppStore';
import { COMPONENT_LIMITS, COMPONENT_TYPES, DEFAULT_COMPONENT_LIMITS, EMPTY_COMPONENT_LIMITS } from '../constants';
import type {
  BicycleComponent,
  ComponentUsagePeriod,
  ComponentHistoryEntry,
  ComponentHistoryInput,
  ComponentHistoryUpdate,
  ComponentInput,
  ComponentUpdate,
} from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const CHAIN_INPUT: ComponentInput = { type: 'chain', model: 'Shimano CN-M8100' };

const ENTRY_INPUT: ComponentHistoryInput = { date: '2026-04-12', installed: '2026-03-01', distance: 412.5 };

/**
 * Adds a component and fails the test if the store rejects it.
 *
 * @param input - Valid component input.
 * @returns The stored component, including its generated id.
 */
function addOrFail(input: ComponentInput): BicycleComponent {
  const result = useAppStore.getState().addComponent(input);

  if (!result.ok) {
    throw new Error(`Fixture rejected: ${JSON.stringify(result.errors)}`);
  }

  return result.component;
}

/**
 * Adds a history entry and fails the test if the store rejects it.
 *
 * @param componentId - Id of a stored component.
 * @param input - Valid history input.
 * @returns The stored entry, including its generated id.
 */
function addEntryOrFail(componentId: string, input: ComponentHistoryInput): ComponentHistoryEntry {
  const result = useAppStore.getState().addComponentHistoryEntry(componentId, input);

  if (!result.ok) {
    throw new Error(`Fixture rejected: ${JSON.stringify(result.errors)}`);
  }

  return result.entry;
}

/**
 * Fills a stored component's history in one write, which is faster than adding hundreds of entries.
 *
 * @param component - A stored component.
 * @param count - Number of entries.
 */
function seedHistory(component: BicycleComponent, count: number): void {
  const history = Array.from(
    { length: count },
    (_, index): ComponentHistoryEntry => ({
      id: `entry-${index}`,
      date: '2026-04-12',
      installed: '2026-03-01',
      distance: null,
      position: null,
      subcomponent: null,
      lubricated: null,
      stretch: null,
      lubricant: null,
      cleaned: null,
    }),
  );

  useAppStore.setState(({ components }) => ({
    components: { ...components, byId: { ...components.byId, [component.id]: { ...component, history } } },
  }));
}

describe('components slice', () => {
  beforeEach(() => {
    useAppStore.setState({ ...INITIAL_APP_STATE });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addComponent', () => {
    it('stores the normalized component under a generated UUID and appends the id', () => {
      const result = useAppStore.getState().addComponent({ type: 'chain', model: '  Shimano CN-M8100 ' });

      if (!result.ok) {
        throw new Error('expected success');
      }
      const { id } = result.component;
      expect(id).toMatch(UUID_PATTERN);
      expect(result.component).toEqual({
        id,
        type: 'chain',
        model: 'Shimano CN-M8100',
        label: null,
        initialDistance: 0,
        limits: { distance: null, stretch: 0.5, lubrication: 300, cleaning: 1500 },
        usage: [],
        retired: null,
        history: [],
      });
      expect(useAppStore.getState().components).toEqual({ byId: { [id]: result.component }, allIds: [id] });
    });

    it.each(COMPONENT_TYPES)('stores a component of type %s', (type) => {
      const { id } = addOrFail({ type, model: 'Model' });

      expect(useAppStore.getState().components.byId[id]).toMatchObject({ type, model: 'Model' });
    });

    it('stores components with the same type and model separately, in insertion order', () => {
      const first = addOrFail(CHAIN_INPUT);
      const second = addOrFail(CHAIN_INPUT);

      expect(first.id).not.toBe(second.id);
      expect(first.history).not.toBe(second.history);
      expect(useAppStore.getState().components.allIds).toEqual([first.id, second.id]);
    });

    it.each(COMPONENT_TYPES.filter((type) => type !== 'chain'))('gives a %s empty limits', (type) => {
      expect(addOrFail({ type, model: 'Model' }).limits).toEqual(EMPTY_COMPONENT_LIMITS);
    });

    it('gives every component its own limits object, never the shared defaults', () => {
      const first = addOrFail(CHAIN_INPUT);
      const second = addOrFail(CHAIN_INPUT);

      expect(first.limits).not.toBe(second.limits);
      expect(first.limits).not.toBe(DEFAULT_COMPONENT_LIMITS.chain);
      expect(Object.isFrozen(first.limits)).toBe(false);
    });

    it('stores the label, the starting distance, and the given limits over the defaults', () => {
      const component = addOrFail({
        ...CHAIN_INPUT,
        label: ' A ',
        initialDistance: 412.5,
        limits: { distance: 4000, stretch: 0.75, cleaning: null },
      });

      expect(component).toMatchObject({
        label: 'A',
        initialDistance: 412.5,
        limits: { distance: 4000, stretch: 0.75, lubrication: 300, cleaning: null },
      });
    });

    it('uses no limits as the base for a type that is not known, and reports only the type', () => {
      expect(useAppStore.getState().addComponent({ type: 'engine', model: 'V8' })).toEqual({
        ok: false,
        errors: [{ field: 'type', code: 'invalidOption' }],
      });
    });

    it('rejects chain-only limits on another type', () => {
      const before = useAppStore.getState();

      expect(before.addComponent({ type: 'tire', model: 'GP5000', limits: { distance: 4000, stretch: 0.5 } })).toEqual({
        ok: false,
        errors: [{ field: 'limits.stretch', code: 'notAllowed' }],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('reports every new field once, in field order', () => {
      const input = {
        type: 'chain',
        model: 'X12',
        label: 'x'.repeat(21),
        initialDistance: -1,
        limits: { distance: 0, stretch: 0, lubrication: 0, cleaning: 0 },
      };

      expect(useAppStore.getState().addComponent(input)).toEqual({
        ok: false,
        errors: [
          { field: 'label', code: 'tooLong' },
          { field: 'initialDistance', code: 'outOfRange' },
          { field: 'limits.distance', code: 'outOfRange' },
          { field: 'limits.stretch', code: 'outOfRange' },
          { field: 'limits.lubrication', code: 'outOfRange' },
          { field: 'limits.cleaning', code: 'outOfRange' },
        ],
      });
    });

    it('ignores usage and retired smuggled into the input', () => {
      const input = { ...CHAIN_INPUT, usage: [{ id: 'period-1' }], retired: { date: '2026-04-12', bicycleId: 'b' } };

      expect(addOrFail(input)).toMatchObject({ usage: [], retired: null });
    });

    it('accepts a model that is at the limit only after trimming', () => {
      const model = 'x'.repeat(60);

      expect(addOrFail({ type: 'chain', model: `  ${model}  ` }).model).toBe(model);
    });

    it('ignores an id and a history smuggled into the input', () => {
      const input = { ...CHAIN_INPUT, id: 'chosen-id', history: [{ id: 'h' }] };

      const component = addOrFail(input);

      expect(component.id).toMatch(UUID_PATTERN);
      expect(component.history).toEqual([]);
    });

    it('does not mutate the initial collection or touch the bicycles', () => {
      const bicycleBefore = useAppStore.getState().bicycle;

      addOrFail(CHAIN_INPUT);

      expect(INITIAL_APP_STATE.components).toEqual({ byId: {}, allIds: [] });
      expect(useAppStore.getState().bicycle).toBe(bicycleBefore);
    });

    it('keeps the stored data plain JSON', () => {
      addOrFail(CHAIN_INPUT);
      const { components } = useAppStore.getState();

      expect(JSON.parse(JSON.stringify(components))).toStrictEqual(components);
    });

    it('returns every error, generates no id, and leaves state unchanged for invalid input', () => {
      addOrFail(CHAIN_INPUT);
      const randomUUID = vi.spyOn(crypto, 'randomUUID');
      const before = useAppStore.getState().components;

      const result = useAppStore.getState().addComponent({ type: ' ', model: 'x'.repeat(61) });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'type', code: 'required' },
          { field: 'model', code: 'tooLong' },
        ],
      });
      expect(randomUUID).not.toHaveBeenCalled();
      expect(useAppStore.getState().components).toBe(before);
    });
  });

  describe('updateComponent', () => {
    let first: BicycleComponent;
    let chain: BicycleComponent;
    let last: BicycleComponent;

    beforeEach(() => {
      first = addOrFail({ type: 'saddle', model: 'Fizik Argo' });
      const { id } = addOrFail(CHAIN_INPUT);
      addEntryOrFail(id, ENTRY_INPUT);
      chain = useAppStore.getState().components.byId[id];
      last = addOrFail({ type: 'stem', model: 'Zipp Service Course' });
    });

    it.each<[string, ComponentUpdate, Partial<BicycleComponent>]>([
      ['model', { model: '  KMC X12 ' }, { model: 'KMC X12' }],
      ['type', { type: ' cassette ' }, { type: 'cassette', limits: EMPTY_COMPONENT_LIMITS }],
      [
        'type and model',
        { type: 'wheel', model: 'DT GR 1600' },
        { type: 'wheel', model: 'DT GR 1600', limits: EMPTY_COMPONENT_LIMITS },
      ],
    ])('changes only the given %s, normalized', (_name, changes, expected) => {
      const result = useAppStore.getState().updateComponent(chain.id, changes);

      if (!result.ok) {
        throw new Error('expected success');
      }
      expect(result.component).toStrictEqual({ ...chain, ...expected });
      expect(useAppStore.getState().components.byId[chain.id]).toBe(result.component);
    });

    describe('with the fields the usage and later actions write', () => {
      const PERIOD: ComponentUsagePeriod = {
        id: 'period-1',
        bicycleId: 'bike-1',
        start: { date: null, odometer: 0 },
        end: { date: '2026-04-12', odometer: 800 },
        replacedPeriodId: null,
      };
      const CUSTOM_LIMITS = { distance: 4000, stretch: 0.75, lubrication: 250, cleaning: 1000 };

      /**
       * Replaces stored fields of `chain` and refreshes it.
       *
       * @param fields - The fields to store.
       */
      function storeOnChain(fields: Partial<BicycleComponent>): void {
        const stored = { ...chain, ...fields };
        useAppStore.setState(({ components }) => ({
          components: { ...components, byId: { ...components.byId, [chain.id]: stored } },
        }));
        chain = stored;
      }

      it('keeps label, initialDistance, limits, usage, and retired when the changes leave them out', () => {
        storeOnChain({
          label: 'A',
          initialDistance: 120,
          limits: CUSTOM_LIMITS,
          usage: [PERIOD],
          retired: { date: '2026-04-12', bicycleId: 'bike-1' },
        });

        const result = useAppStore.getState().updateComponent(chain.id, { model: 'KMC X12' });

        expect(result).toEqual({ ok: true, component: { ...chain, model: 'KMC X12' } });
      });

      it('changes the label and single limits, and ignores usage and retired', () => {
        storeOnChain({ label: 'A', limits: CUSTOM_LIMITS, usage: [PERIOD] });
        const changes = {
          label: ' B ',
          limits: { stretch: 0.5, cleaning: null },
          usage: [],
          retired: { date: '2026-04-12', bicycleId: 'bike-1' },
        };

        const result = useAppStore.getState().updateComponent(chain.id, changes);

        expect(result).toEqual({
          ok: true,
          component: { ...chain, label: 'B', limits: { ...CUSTOM_LIMITS, stretch: 0.5, cleaning: null } },
        });
      });

      it('changes the starting distance of a component without history distances', () => {
        const tire = addOrFail({ type: 'tire', model: 'GP5000' });

        expect(useAppStore.getState().updateComponent(tire.id, { initialDistance: 850.5 })).toEqual({
          ok: true,
          component: { ...tire, initialDistance: 850.5 },
        });
      });

      it('clears the label with null or blank text', () => {
        storeOnChain({ label: 'A' });

        expect(useAppStore.getState().updateComponent(chain.id, { label: null })).toMatchObject({
          ok: true,
          component: { label: null },
        });
        storeOnChain({ label: 'A' });
        expect(useAppStore.getState().updateComponent(chain.id, { label: '  ' })).toMatchObject({
          ok: true,
          component: { label: null },
        });
      });

      it('starts a type change from the new type defaults, then applies the given limits', () => {
        const tire = addOrFail({ type: 'tire', model: 'GP5000', limits: { distance: 4000 } });

        const result = useAppStore.getState().updateComponent(tire.id, { type: 'chain', limits: { stretch: 0.75 } });

        expect(result).toMatchObject({
          ok: true,
          component: { limits: { distance: null, stretch: 0.75, lubrication: 300, cleaning: 1500 } },
        });
      });

      it('drops chain limits on a change to another type, so they never block it', () => {
        storeOnChain({ limits: CUSTOM_LIMITS });

        const result = useAppStore.getState().updateComponent(chain.id, { type: 'cassette' });

        expect(result).toMatchObject({ ok: true, component: { limits: EMPTY_COMPONENT_LIMITS } });
      });

      it('rejects chain-only limits on another type', () => {
        const tire = addOrFail({ type: 'tire', model: 'GP5000' });

        expect(useAppStore.getState().updateComponent(tire.id, { limits: { lubrication: 300 } })).toEqual({
          ok: false,
          errors: [{ field: 'limits.lubrication', code: 'notAllowed' }],
        });
      });

      describe('once a whole-component history entry has a distance', () => {
        beforeEach(() => {
          storeOnChain({ initialDistance: 120 });
        });

        it('rejects a new initialDistance, changing nothing', () => {
          const before = useAppStore.getState();

          expect(before.updateComponent(chain.id, { initialDistance: 0 })).toEqual({
            ok: false,
            errors: [{ field: 'initialDistance', code: 'notAllowed' }],
          });
          expect(useAppStore.getState()).toBe(before);
        });

        it('accepts the unchanged initialDistance', () => {
          const result = useAppStore.getState().updateComponent(chain.id, { initialDistance: 120, model: 'X11' });

          expect(result.ok).toBe(true);
        });

        it('reports notAllowed instead of the number rules, among the other errors in field order', () => {
          const changes = { model: '', initialDistance: -1, limits: { cleaning: 0 } };

          expect(useAppStore.getState().updateComponent(chain.id, changes)).toEqual({
            ok: false,
            errors: [
              { field: 'model', code: 'required' },
              { field: 'initialDistance', code: 'notAllowed' },
              { field: 'limits.cleaning', code: 'outOfRange' },
            ],
          });
        });
      });

      it('allows a new initialDistance while only subcomponent entries have a distance', () => {
        const wheel = addOrFail({ type: 'wheel', model: 'G1800' });
        addEntryOrFail(wheel.id, { ...ENTRY_INPUT, subcomponent: 'rim' });

        expect(useAppStore.getState().updateComponent(wheel.id, { initialDistance: 300 }).ok).toBe(true);
      });

      it('allows a new initialDistance while whole-component entries have no distance', () => {
        const saddle = addOrFail({ type: 'saddle', model: 'Argo' });
        addEntryOrFail(saddle.id, { ...ENTRY_INPUT, distance: null });

        expect(useAppStore.getState().updateComponent(saddle.id, { initialDistance: 300 }).ok).toBe(true);
      });

      it('does not write when the given values equal the stored ones', () => {
        storeOnChain({ label: 'A', limits: CUSTOM_LIMITS });
        const before = useAppStore.getState();

        const result = before.updateComponent(chain.id, { label: ' A ', limits: { ...CUSTOM_LIMITS } });

        expect(result).toEqual({ ok: true, component: chain });
        expect(useAppStore.getState()).toBe(before);
      });

      it('rejects a new type once the component has usage periods', () => {
        storeOnChain({ usage: [PERIOD] });
        const before = useAppStore.getState();

        expect(before.updateComponent(chain.id, { type: 'cassette' })).toEqual({
          ok: false,
          errors: [{ field: 'type', code: 'notAllowed' }],
        });
        expect(useAppStore.getState()).toBe(before);
      });

      it('reports the type conflict with the other errors, in field order', () => {
        storeOnChain({ usage: [PERIOD] });

        expect(useAppStore.getState().updateComponent(chain.id, { type: 'cassette', model: '' })).toEqual({
          ok: false,
          errors: [
            { field: 'type', code: 'notAllowed' },
            { field: 'model', code: 'required' },
          ],
        });
      });

      it('allows other changes, and the same type, once the component has usage periods', () => {
        storeOnChain({ usage: [PERIOD] });

        const result = useAppStore.getState().updateComponent(chain.id, { type: ' chain ', model: 'KMC X12' });

        expect(result).toEqual({ ok: true, component: { ...chain, model: 'KMC X12' } });
      });

      it('keeps limits the rider changed when the type stays the same', () => {
        storeOnChain({ limits: CUSTOM_LIMITS });

        const result = useAppStore.getState().updateComponent(chain.id, { model: 'KMC X12' });

        expect(result.ok && result.component.limits).toEqual(CUSTOM_LIMITS);
      });

      it('applies the default limits of a new type', () => {
        const tire = addOrFail({ type: 'tire', model: 'GP5000' });

        const result = useAppStore.getState().updateComponent(tire.id, { type: 'chain' });

        expect(result).toEqual({
          ok: true,
          component: { ...tire, type: 'chain', limits: DEFAULT_COMPONENT_LIMITS.chain },
        });
      });
    });

    it('keeps the history reference, the place in allIds, and the other components', () => {
      const allIdsBefore = useAppStore.getState().components.allIds;

      useAppStore.getState().updateComponent(chain.id, { type: 'cassette', model: 'XT' });

      const { byId, allIds } = useAppStore.getState().components;
      expect(byId[chain.id].history).toBe(chain.history);
      expect(allIds).toBe(allIdsBefore);
      expect(byId[first.id]).toBe(first);
      expect(byId[last.id]).toBe(last);
    });

    it('does not mutate the previous collection', () => {
      const before = useAppStore.getState().components;

      useAppStore.getState().updateComponent(chain.id, { model: 'KMC X12' });

      expect(before.byId[chain.id]).toBe(chain);
      expect(chain.model).toBe('Shimano CN-M8100');
    });

    it.each<[string, ComponentUpdate]>([
      ['omitted', {}],
      ['undefined', { type: undefined, model: undefined }],
      ['equal after trimming', { type: ' chain ', model: ' Shimano CN-M8100 ' }],
    ])('returns the stored component and does not write state when keys are %s', (_name, changes) => {
      const before = useAppStore.getState();

      const result = before.updateComponent(chain.id, changes);

      expect(result).toEqual({ ok: true, component: chain });
      expect(result.ok && result.component).toBe(chain);
      expect(useAppStore.getState()).toBe(before);
    });

    it('leaves an undefined key unchanged while another key changes', () => {
      const result = useAppStore.getState().updateComponent(chain.id, { type: undefined, model: 'KMC X12' });

      expect(result).toEqual({ ok: true, component: { ...chain, model: 'KMC X12' } });
    });

    it('ignores an id and a history smuggled into the changes', () => {
      const changes = { model: 'KMC X12', id: 'other-id', history: [] };

      const result = useAppStore.getState().updateComponent(chain.id, changes);

      expect(result).toEqual({ ok: true, component: { ...chain, model: 'KMC X12' } });
      expect(useAppStore.getState().components.byId[chain.id].history).toBe(chain.history);
      expect(Object.keys(useAppStore.getState().components.byId)).toEqual([first.id, chain.id, last.id]);
    });

    it.each<ComponentUpdate>([
      { type: ' ' },
      { type: 'engine' },
      { model: '  ' },
      { model: 'x'.repeat(61) },
      { model: 'a\nb' },
      { type: 'engine', model: '' },
    ])('returns the same errors as addComponent and leaves state unchanged for %j', (changes) => {
      const before = useAppStore.getState();
      const expected = before.addComponent({ ...CHAIN_INPUT, ...changes });

      const result = before.updateComponent(chain.id, changes);

      expect(result.ok).toBe(false);
      expect(result).toEqual(expected);
      expect(useAppStore.getState()).toBe(before);
    });

    describe('with type-specific history', () => {
      let brakes: BicycleComponent;

      /**
       * Adds an entry to `brakes` and refreshes it.
       *
       * @param input - Type-specific history fields.
       * @returns The store state after the entry was added.
       */
      function withBrakesEntry(input: Partial<ComponentHistoryInput>): ReturnType<typeof useAppStore.getState> {
        addEntryOrFail(brakes.id, { ...ENTRY_INPUT, ...input });
        brakes = useAppStore.getState().components.byId[brakes.id];

        return useAppStore.getState();
      }

      beforeEach(() => {
        brakes = addOrFail({ type: 'brakes', model: 'Shimano GRX' });
      });

      it.each<[string, Partial<ComponentHistoryInput>, string]>([
        ['a subcomponent on a type without subcomponents', { subcomponent: 'rotor' }, 'chain'],
        ['a subcomponent that is not an option of the new type', { subcomponent: 'rotor' }, 'shifters'],
        ['a position on a type without positions', { position: 'front' }, 'wheel'],
      ])('rejects a new type with only notAllowed for %s', (_name, input, type) => {
        const before = withBrakesEntry(input);

        const result = before.updateComponent(brakes.id, { type });

        expect(result).toEqual({ ok: false, errors: [{ field: 'type', code: 'notAllowed' }] });
        expect(useAppStore.getState()).toBe(before);
      });

      it.each<Partial<ComponentHistoryInput>>([{ lubricated: '2026-04-12' }, { stretch: 0.5 }, { stretch: 0 }])(
        'rejects a new type for a chain with %j',
        (input) => {
          addEntryOrFail(chain.id, { ...ENTRY_INPUT, ...input });
          const before = useAppStore.getState();

          const result = before.updateComponent(chain.id, { type: 'cassette' });

          expect(result).toEqual({ ok: false, errors: [{ field: 'type', code: 'notAllowed' }] });
          expect(useAppStore.getState()).toBe(before);
        },
      );

      it('rejects a new type when only a later entry conflicts', () => {
        withBrakesEntry({ subcomponent: 'hose' });
        const before = withBrakesEntry({ subcomponent: 'rotor' });

        const result = before.updateComponent(brakes.id, { type: 'shifters' });

        expect(result).toEqual({ ok: false, errors: [{ field: 'type', code: 'notAllowed' }] });
        expect(useAppStore.getState()).toBe(before);
      });

      it('reports the conflicting type before an invalid model', () => {
        const before = withBrakesEntry({ subcomponent: 'rotor' });

        const result = before.updateComponent(brakes.id, { type: 'chain', model: ' ' });

        expect(result).toEqual({
          ok: false,
          errors: [
            { field: 'type', code: 'notAllowed' },
            { field: 'model', code: 'required' },
          ],
        });
        expect(useAppStore.getState()).toBe(before);
      });

      it('reports an unknown type as invalidOption only', () => {
        const before = withBrakesEntry({ subcomponent: 'rotor' });

        const result = before.updateComponent(brakes.id, { type: 'engine' });

        expect(result).toEqual({ ok: false, errors: [{ field: 'type', code: 'invalidOption' }] });
      });

      it('accepts a new type that every entry fits', () => {
        withBrakesEntry({ position: 'front' });
        withBrakesEntry({ subcomponent: 'hose' });
        const before = withBrakesEntry({ position: 'rear', subcomponent: 'hose' });

        const result = before.updateComponent(brakes.id, { type: 'shifters' });

        expect(result).toEqual({ ok: true, component: { ...brakes, type: 'shifters' } });
        expect(useAppStore.getState().components.byId[brakes.id].history).toBe(brakes.history);
      });

      // The seeded entry does not fit its own type, so these updates succeed only if the rule is skipped.
      it.each<ComponentUpdate>([{ model: 'SRAM Rival' }, { type: ' brakes ', model: 'SRAM Rival' }])(
        'does not check the history when the type stays the same: %j',
        (changes) => {
          const entry: ComponentHistoryEntry = {
            id: 'entry-1',
            date: '2026-04-12',
            installed: '2026-03-01',
            distance: null,
            position: null,
            subcomponent: 'rim',
            lubricated: null,
            stretch: null,
            lubricant: null,
            cleaned: null,
          };
          const seeded: BicycleComponent = { ...brakes, history: [entry] };
          useAppStore.setState(({ components }) => ({
            components: { ...components, byId: { ...components.byId, [brakes.id]: seeded } },
          }));

          const result = useAppStore.getState().updateComponent(brakes.id, changes);

          expect(result).toEqual({ ok: true, component: { ...seeded, model: 'SRAM Rival' } });
        },
      );
    });

    it.each(['unknown-id', 'toString', '__proto__'])('returns only notFound for the id %j', (id) => {
      const before = useAppStore.getState();

      const result = before.updateComponent(id, { model: '' });

      expect(result).toEqual({ ok: false, errors: [{ field: 'id', code: 'notFound' }] });
      expect(useAppStore.getState()).toBe(before);
    });
  });

  describe('removeComponent', () => {
    it('removes the component from byId and allIds and keeps the others', () => {
      const first = addOrFail(CHAIN_INPUT);
      const removed = addOrFail(CHAIN_INPUT);
      const last = addOrFail({ type: 'stem', model: 'Zipp Service Course' });
      const before = useAppStore.getState().components;

      expect(useAppStore.getState().removeComponent(removed.id)).toBe(true);

      const { byId, allIds } = useAppStore.getState().components;
      expect(Object.keys(byId)).toEqual([first.id, last.id]);
      expect(allIds).toEqual([first.id, last.id]);
      expect(byId[first.id]).toBe(first);
      expect(byId[last.id]).toBe(last);
      expect(before.byId[removed.id]).toBe(removed);
      expect(before.allIds).toEqual([first.id, removed.id, last.id]);
    });

    it('returns false when the component was already removed', () => {
      const { id } = addOrFail(CHAIN_INPUT);
      useAppStore.getState().removeComponent(id);

      expect(useAppStore.getState().removeComponent(id)).toBe(false);
    });

    it.each(['unknown-id', 'toString', '__proto__'])('returns false and changes nothing for the id %j', (id) => {
      addOrFail(CHAIN_INPUT);
      const before = useAppStore.getState();

      expect(before.removeComponent(id)).toBe(false);
      expect(useAppStore.getState()).toBe(before);
    });
  });

  describe('addComponentHistoryEntry', () => {
    let first: BicycleComponent;
    let chain: BicycleComponent;

    beforeEach(() => {
      first = addOrFail({ type: 'saddle', model: 'Fizik Argo' });
      chain = addOrFail(CHAIN_INPUT);
    });

    it('appends the normalized entry under a generated UUID', () => {
      const result = useAppStore.getState().addComponentHistoryEntry(chain.id, {
        date: ' 2026-04-12 ',
        installed: ' 2026-03-01',
        distance: 412.5,
      });

      if (!result.ok) {
        throw new Error('expected success');
      }
      const { id } = result.entry;
      expect(id).toMatch(UUID_PATTERN);
      expect(result.entry).toStrictEqual({
        id,
        date: '2026-04-12',
        installed: '2026-03-01',
        distance: 412.5,
        position: null,
        subcomponent: null,
        lubricated: null,
        stretch: null,
        lubricant: null,
        cleaned: null,
      });

      const stored = useAppStore.getState().components.byId[chain.id];
      expect(stored).toStrictEqual({ ...chain, history: [result.entry] });
      expect(stored.history[0]).toBe(result.entry);
    });

    it('stores a clean with relubrication, trimmed', () => {
      const result = useAppStore.getState().addComponentHistoryEntry(chain.id, {
        ...ENTRY_INPUT,
        lubricated: '2026-04-12',
        lubricant: ' wax ',
        cleaned: ' 2026-04-12 ',
      });

      expect(result).toMatchObject({
        ok: true,
        entry: { lubricated: '2026-04-12', lubricant: 'wax', cleaned: '2026-04-12' },
      });
    });

    it('stores blank lubricant and cleaned as null', () => {
      const input = { ...ENTRY_INPUT, lubricated: '2026-04-12', lubricant: ' ', cleaned: '' };

      const result = useAppStore.getState().addComponentHistoryEntry(chain.id, input);

      expect(result).toMatchObject({ ok: true, entry: { lubricated: '2026-04-12', lubricant: null, cleaned: null } });
    });

    it('accepts a distance of 1 000 000', () => {
      const result = useAppStore.getState().addComponentHistoryEntry(chain.id, { ...ENTRY_INPUT, distance: 1_000_000 });

      expect(result).toMatchObject({ ok: true, entry: { distance: 1_000_000 } });
    });

    it('rejects a lubricant on a type without chain care, changing nothing', () => {
      const before = useAppStore.getState();
      const input = { ...ENTRY_INPUT, lubricant: 'oil', cleaned: '2026-04-12' };

      expect(before.addComponentHistoryEntry(first.id, input)).toEqual({
        ok: false,
        errors: [
          { field: 'lubricant', code: 'notAllowed' },
          { field: 'cleaned', code: 'notAllowed' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it.each(COMPONENT_TYPES)('adds an entry to a component of type %s', (type) => {
      const { id } = addOrFail({ type, model: 'Model' });

      const entry = addEntryOrFail(id, ENTRY_INPUT);

      expect(useAppStore.getState().components.byId[id].history).toEqual([entry]);
    });

    it('keeps the other components, the place in allIds, and earlier entries', () => {
      const earlier = addEntryOrFail(chain.id, ENTRY_INPUT);
      const { allIds } = useAppStore.getState().components;

      addEntryOrFail(chain.id, ENTRY_INPUT);

      const { components } = useAppStore.getState();
      expect(components.byId[first.id]).toBe(first);
      expect(components.allIds).toBe(allIds);
      expect(components.byId[chain.id].history[0]).toBe(earlier);
    });

    it('does not mutate the previous collection', () => {
      const before = useAppStore.getState().components;

      addEntryOrFail(chain.id, ENTRY_INPUT);

      expect(before.byId[chain.id]).toBe(chain);
      expect(chain.history).toEqual([]);
    });

    it('keeps later records of the same installation', () => {
      const entries = [
        addEntryOrFail(chain.id, { date: '2026-03-01', installed: '2026-03-01', distance: 0 }),
        addEntryOrFail(chain.id, { date: '2026-04-12', installed: '2026-03-01', distance: 412.5 }),
      ];

      expect(useAppStore.getState().components.byId[chain.id].history).toEqual(entries);
    });

    it('keeps insertion order when dates are out of order, before and after the installation', () => {
      const dates = ['2026-05-01', '2026-02-28', '2026-03-01'];

      dates.forEach((date) => addEntryOrFail(chain.id, { date, installed: '2026-03-01' }));

      expect(useAppStore.getState().components.byId[chain.id].history.map(({ date }) => date)).toEqual(dates);
    });

    it('keeps entries that share every value except the id', () => {
      const one = addEntryOrFail(chain.id, ENTRY_INPUT);
      const two = addEntryOrFail(chain.id, ENTRY_INPUT);

      expect(one.id).not.toBe(two.id);
      expect(one).toEqual({ ...two, id: one.id });
      expect(useAppStore.getState().components.byId[chain.id].history).toEqual([one, two]);
    });

    // toBe uses Object.is, which tells 0 from -0.
    it.each([
      [undefined, null],
      [null, null],
      [0, 0],
      [-0, 0],
    ])('stores the distance %s as %s', (distance, expected) => {
      expect(addEntryOrFail(chain.id, { ...ENTRY_INPUT, distance }).distance).toBe(expected);
    });

    it('stores the normalized position and subcomponent', () => {
      const { id } = addOrFail({ type: 'brakes', model: 'Shimano GRX' });

      const entry = addEntryOrFail(id, { ...ENTRY_INPUT, position: ' rear ', subcomponent: ' brakePads ' });

      expect(entry).toMatchObject({ position: 'rear', subcomponent: 'brakePads' });
      expect(useAppStore.getState().components.byId[id].history).toEqual([entry]);
    });

    describe.each(COMPONENT_TYPES)('on %s', (type) => {
      it.each([undefined, null, '', '  '])('stores the position, subcomponent, and lubricated %j as null', (value) => {
        const { id } = addOrFail({ type, model: 'Model' });

        const entry = addEntryOrFail(id, { ...ENTRY_INPUT, position: value, subcomponent: value, lubricated: value });

        expect(entry).toMatchObject({ position: null, subcomponent: null, lubricated: null });
      });

      it.each([undefined, null])('stores the stretch %s as null', (stretch) => {
        const { id } = addOrFail({ type, model: 'Model' });

        expect(addEntryOrFail(id, { ...ENTRY_INPUT, stretch }).stretch).toBeNull();
      });
    });

    it('keeps every lubrication of the same installation', () => {
      const entries = [
        addEntryOrFail(chain.id, { date: '2026-03-01', installed: '2026-03-01', lubricated: ' 2026-02-20 ' }),
        addEntryOrFail(chain.id, {
          date: '2026-04-12',
          installed: '2026-03-01',
          lubricated: '2026-04-12',
          stretch: 0.25,
        }),
      ];

      expect(entries).toMatchObject([
        { lubricated: '2026-02-20', stretch: null },
        { lubricated: '2026-04-12', stretch: 0.25 },
      ]);
      expect(useAppStore.getState().components.byId[chain.id].history).toEqual(entries);
    });

    // toBe uses Object.is, which tells 0 from -0.
    it.each([0, -0])('stores the stretch %s as 0', (stretch) => {
      expect(addEntryOrFail(chain.id, { ...ENTRY_INPUT, stretch }).stretch).toBe(0);
    });

    it('rejects chain care on another type and leaves state unchanged', () => {
      const before = useAppStore.getState();

      const result = before.addComponentHistoryEntry(first.id, {
        ...ENTRY_INPUT,
        lubricated: '2026-04-12',
        stretch: -0,
      });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'lubricated', code: 'notAllowed' },
          { field: 'stretch', code: 'notAllowed' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('validates the position and subcomponent against the component type', () => {
      const { id } = addOrFail({ type: 'wheel', model: 'DT GR 1600' });
      const before = useAppStore.getState();

      const result = before.addComponentHistoryEntry(id, { ...ENTRY_INPUT, position: 'rear', subcomponent: 'rotor' });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'position', code: 'notAllowed' },
          { field: 'subcomponent', code: 'invalidOption' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    it('ignores an id smuggled into the input', () => {
      const input = { ...ENTRY_INPUT, id: 'chosen-id' };

      expect(addEntryOrFail(chain.id, input).id).toMatch(UUID_PATTERN);
    });

    it('keeps the stored data plain JSON', () => {
      addEntryOrFail(chain.id, ENTRY_INPUT);
      addEntryOrFail(chain.id, { ...ENTRY_INPUT, distance: -0, lubricated: '2026-04-12', stretch: -0 });
      addEntryOrFail(chain.id, { ...ENTRY_INPUT, distance: undefined });
      const { components } = useAppStore.getState();

      expect(JSON.parse(JSON.stringify(components))).toStrictEqual(components);
    });

    it('returns every error, generates no id, and leaves state unchanged for invalid input', () => {
      const randomUUID = vi.spyOn(crypto, 'randomUUID');
      const before = useAppStore.getState();

      const result = before.addComponentHistoryEntry(chain.id, {
        date: '  ',
        installed: '2023-02-30',
        distance: 412.55,
      });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'date', code: 'required' },
          { field: 'installed', code: 'invalidFormat' },
          { field: 'distance', code: 'invalidFormat' },
        ],
      });
      expect(randomUUID).not.toHaveBeenCalled();
      expect(useAppStore.getState()).toBe(before);
    });

    describe.each<[string, ComponentHistoryInput]>([
      ['valid', ENTRY_INPUT],
      ['invalid', { date: '', installed: '', distance: NaN }],
    ])('with %s input', (_name, input) => {
      it.each(['unknown-id', 'toString', '__proto__'])('returns only notFound for the component %j', (id) => {
        const randomUUID = vi.spyOn(crypto, 'randomUUID');
        const before = useAppStore.getState();

        const result = before.addComponentHistoryEntry(id, input);

        expect(result).toEqual({ ok: false, errors: [{ field: 'componentId', code: 'notFound' }] });
        expect(randomUUID).not.toHaveBeenCalled();
        expect(useAppStore.getState()).toBe(before);
      });

      it('returns only tooMany for a full history', () => {
        seedHistory(chain, COMPONENT_LIMITS.historyMaxCount);
        const randomUUID = vi.spyOn(crypto, 'randomUUID');
        const before = useAppStore.getState();

        const result = before.addComponentHistoryEntry(chain.id, input);

        expect(result).toEqual({ ok: false, errors: [{ field: 'history', code: 'tooMany' }] });
        expect(randomUUID).not.toHaveBeenCalled();
        expect(useAppStore.getState()).toBe(before);
      });
    });

    it('accepts the 500th entry', () => {
      seedHistory(chain, 499);

      const entry = addEntryOrFail(chain.id, ENTRY_INPUT);

      const { history } = useAppStore.getState().components.byId[chain.id];
      expect(history).toHaveLength(500);
      expect(history[499]).toBe(entry);
    });
  });

  describe('updateComponentHistoryEntry', () => {
    let other: BicycleComponent;
    let chain: BicycleComponent;
    let first: ComponentHistoryEntry;
    let entry: ComponentHistoryEntry;
    let last: ComponentHistoryEntry;

    beforeEach(() => {
      const { id: otherId } = addOrFail({ type: 'brakes', model: 'Shimano GRX' });
      addEntryOrFail(otherId, { ...ENTRY_INPUT, position: 'rear', subcomponent: 'brakePads' });
      const { id } = addOrFail(CHAIN_INPUT);
      first = addEntryOrFail(id, ENTRY_INPUT);
      entry = addEntryOrFail(id, { ...ENTRY_INPUT, lubricated: '2026-04-12', stretch: 0.25 });
      last = addEntryOrFail(id, ENTRY_INPUT);
      other = useAppStore.getState().components.byId[otherId];
      chain = useAppStore.getState().components.byId[id];
    });

    it.each<[ComponentHistoryUpdate, Partial<ComponentHistoryEntry>]>([
      [{ date: ' 2026-05-01 ' }, { date: '2026-05-01' }],
      [{ installed: '2026-02-01' }, { installed: '2026-02-01' }],
      [{ distance: 500 }, { distance: 500 }],
      [{ lubricated: ' 2026-05-01' }, { lubricated: '2026-05-01' }],
      [{ stretch: 0.5 }, { stretch: 0.5 }],
      [
        { date: '2026-05-01', distance: 500, stretch: 0.5 },
        { date: '2026-05-01', distance: 500, stretch: 0.5 },
      ],
    ])('changes only the given keys, normalized: %j', (changes, expected) => {
      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, changes);

      if (!result.ok) {
        throw new Error('expected success');
      }
      expect(result.entry).toStrictEqual({ ...entry, ...expected });
      expect(useAppStore.getState().components.byId[chain.id].history[1]).toBe(result.entry);
    });

    describe('chain care', () => {
      let care: ComponentHistoryEntry;

      beforeEach(() => {
        care = addEntryOrFail(chain.id, {
          ...ENTRY_INPUT,
          lubricated: '2026-04-12',
          lubricant: 'wax',
          cleaned: '2026-04-12',
        });
      });

      it('changes the lubricant and clears the cleaning date with blank text', () => {
        const changes = { lubricant: ' oil ', cleaned: '  ' };

        const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, care.id, changes);

        expect(result).toEqual({ ok: true, entry: { ...care, lubricant: 'oil', cleaned: null } });
      });

      it('fails, changing nothing, when only lubricated is cleared', () => {
        const before = useAppStore.getState();

        expect(before.updateComponentHistoryEntry(chain.id, care.id, { lubricated: null })).toEqual({
          ok: false,
          errors: [
            { field: 'lubricated', code: 'required' },
            { field: 'lubricant', code: 'notAllowed' },
          ],
        });
        expect(useAppStore.getState()).toBe(before);
      });

      it('removes the lubrication when lubricated, lubricant, and cleaned are cleared in one call', () => {
        const changes = { lubricated: null, lubricant: '', cleaned: null };

        const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, care.id, changes);

        expect(result).toEqual({ ok: true, entry: { ...care, lubricated: null, lubricant: null, cleaned: null } });
      });

      it('rejects moving the lubrication to another day than the clean', () => {
        const changes = { lubricated: '2026-04-13' };

        const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, care.id, changes);

        expect(result).toEqual({ ok: false, errors: [{ field: 'cleaned', code: 'notAllowed' }] });
      });
    });

    it('changes the position and subcomponent', () => {
      const [stored] = other.history;

      const result = useAppStore
        .getState()
        .updateComponentHistoryEntry(other.id, stored.id, { position: 'front', subcomponent: ' rotor ' });

      expect(result).toEqual({ ok: true, entry: { ...stored, position: 'front', subcomponent: 'rotor' } });
    });

    it('keeps the place of the entry, the other entries, the other components, and allIds', () => {
      const { allIds: allIdsBefore } = useAppStore.getState().components;

      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, { distance: 500 });

      const { byId, allIds } = useAppStore.getState().components;
      const updated = { ...entry, distance: 500 };
      expect(result).toEqual({ ok: true, entry: updated });
      expect(byId[chain.id]).toStrictEqual({ ...chain, history: [first, updated, last] });
      expect(byId[chain.id].history[0]).toBe(first);
      expect(byId[chain.id].history[2]).toBe(last);
      expect(byId[other.id]).toBe(other);
      expect(allIds).toBe(allIdsBefore);
    });

    it('does not mutate the previous collection', () => {
      const before = useAppStore.getState().components;
      const snapshot = structuredClone(before);

      useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, { distance: 500 });

      expect(before).toStrictEqual(snapshot);
    });

    it.each<ComponentHistoryUpdate>([
      { distance: null },
      { lubricated: null },
      { lubricated: '  ' },
      { stretch: null },
    ])('clears the optional field in %j', (changes) => {
      const [field] = Object.keys(changes);

      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, changes);

      expect(result).toEqual({ ok: true, entry: { ...entry, [field]: null } });
    });

    it.each([null, '', ' '])('clears the position and subcomponent with %j', (value) => {
      const [stored] = other.history;

      const result = useAppStore
        .getState()
        .updateComponentHistoryEntry(other.id, stored.id, { position: value, subcomponent: value });

      expect(result).toEqual({ ok: true, entry: { ...stored, position: null, subcomponent: null } });
    });

    // toBe uses Object.is, which tells 0 from -0.
    it('stores -0 as 0', () => {
      const result = useAppStore
        .getState()
        .updateComponentHistoryEntry(chain.id, entry.id, { distance: -0, stretch: -0 });

      expect(result.ok && result.entry.distance).toBe(0);
      expect(result.ok && result.entry.stretch).toBe(0);
    });

    it('leaves omitted and undefined keys unchanged', () => {
      const changes: ComponentHistoryUpdate = {
        date: undefined,
        installed: undefined,
        position: undefined,
        lubricated: undefined,
        stretch: undefined,
        distance: 500,
      };

      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, changes);

      expect(result).toEqual({ ok: true, entry: { ...entry, distance: 500 } });
    });

    it('ignores an id and an extra key smuggled into the changes', () => {
      const changes = { distance: 500, id: 'other-id', extra: true };

      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, entry.id, changes);

      expect(result.ok && result.entry).toStrictEqual({ ...entry, distance: 500 });
    });

    it.each<ComponentHistoryUpdate>([
      { date: ' ' },
      { installed: '2023-02-30' },
      { distance: 412.55 },
      { position: 'front' },
      { subcomponent: 'rotor' },
      { lubricated: 'yesterday' },
      { stretch: 5.01 },
      { date: '', installed: '', distance: -1, position: 'left', subcomponent: 'x', lubricated: 'x', stretch: NaN },
    ])('returns the same errors as addComponentHistoryEntry and leaves state unchanged for %j', (changes) => {
      const before = useAppStore.getState();
      const expected = before.addComponentHistoryEntry(chain.id, { ...ENTRY_INPUT, ...changes });

      const result = before.updateComponentHistoryEntry(chain.id, entry.id, changes);

      expect(result.ok).toBe(false);
      expect(result).toEqual(expected);
      expect(useAppStore.getState()).toBe(before);
    });

    it('validates against the type of the component', () => {
      const before = useAppStore.getState();

      const result = before.updateComponentHistoryEntry(other.id, other.history[0].id, {
        subcomponent: 'rim',
        stretch: 0,
      });

      expect(result).toEqual({
        ok: false,
        errors: [
          { field: 'subcomponent', code: 'invalidOption' },
          { field: 'stretch', code: 'notAllowed' },
        ],
      });
      expect(useAppStore.getState()).toBe(before);
    });

    describe.each<[string, ComponentHistoryUpdate]>([
      ['valid', { distance: 500 }],
      ['invalid', { date: '', distance: NaN }],
    ])('with %s changes', (_name, changes) => {
      it.each(['unknown-id', 'toString', '__proto__'])('returns only notFound for the component %j', (id) => {
        const before = useAppStore.getState();

        expect(before.updateComponentHistoryEntry(id, entry.id, changes)).toEqual({
          ok: false,
          errors: [{ field: 'componentId', code: 'notFound' }],
        });
        expect(useAppStore.getState()).toBe(before);
      });

      it('returns only the unknown component when the entry is unknown too', () => {
        expect(useAppStore.getState().updateComponentHistoryEntry('unknown-id', 'unknown-id', changes)).toEqual({
          ok: false,
          errors: [{ field: 'componentId', code: 'notFound' }],
        });
      });

      it.each(['unknown-id', 'toString', '__proto__', '0'])('returns only notFound for the entry %j', (id) => {
        const before = useAppStore.getState();

        expect(before.updateComponentHistoryEntry(chain.id, id, changes)).toEqual({
          ok: false,
          errors: [{ field: 'id', code: 'notFound' }],
        });
        expect(useAppStore.getState()).toBe(before);
      });

      it('returns only notFound for an entry of another component', () => {
        const before = useAppStore.getState();

        expect(before.updateComponentHistoryEntry(other.id, entry.id, changes)).toEqual({
          ok: false,
          errors: [{ field: 'id', code: 'notFound' }],
        });
        expect(useAppStore.getState()).toBe(before);
      });
    });

    it('edits an entry of a full history', () => {
      seedHistory(chain, COMPONENT_LIMITS.historyMaxCount);

      const result = useAppStore.getState().updateComponentHistoryEntry(chain.id, 'entry-499', { distance: 500 });

      const { history } = useAppStore.getState().components.byId[chain.id];
      expect(result.ok).toBe(true);
      expect(history).toHaveLength(500);
      expect(history[499]).toMatchObject({ id: 'entry-499', distance: 500 });
    });
  });

  describe('removeComponentHistoryEntry', () => {
    let other: BicycleComponent;
    let chain: BicycleComponent;

    beforeEach(() => {
      const { id: otherId } = addOrFail({ type: 'saddle', model: 'Fizik Argo' });
      addEntryOrFail(otherId, ENTRY_INPUT);
      const { id } = addOrFail(CHAIN_INPUT);
      addEntryOrFail(id, ENTRY_INPUT);
      addEntryOrFail(id, ENTRY_INPUT);
      addEntryOrFail(id, ENTRY_INPUT);
      other = useAppStore.getState().components.byId[otherId];
      chain = useAppStore.getState().components.byId[id];
    });

    it('removes only that entry and keeps everything else', () => {
      const before = useAppStore.getState().components;
      const snapshot = structuredClone(before);
      const [first, removed, last] = chain.history;

      expect(useAppStore.getState().removeComponentHistoryEntry(chain.id, removed.id)).toBe(true);

      const { byId, allIds } = useAppStore.getState().components;
      expect(byId[chain.id]).toStrictEqual({ ...chain, history: [first, last] });
      expect(byId[chain.id].history[0]).toBe(first);
      expect(byId[chain.id].history[1]).toBe(last);
      expect(byId[other.id]).toBe(other);
      expect(allIds).toBe(before.allIds);
      expect(before).toStrictEqual(snapshot);
    });

    it('leaves an empty history after the last entry is removed', () => {
      useAppStore.getState().removeComponentHistoryEntry(other.id, other.history[0].id);

      expect(useAppStore.getState().components.byId[other.id]).toStrictEqual({ ...other, history: [] });
    });

    it('returns false when the entry was already removed', () => {
      const [{ id }] = chain.history;
      useAppStore.getState().removeComponentHistoryEntry(chain.id, id);

      expect(useAppStore.getState().removeComponentHistoryEntry(chain.id, id)).toBe(false);
    });

    it.each(['unknown-id', 'toString', '__proto__'])('returns false and changes nothing for the component %j', (id) => {
      const before = useAppStore.getState();

      expect(before.removeComponentHistoryEntry(id, chain.history[0].id)).toBe(false);
      expect(useAppStore.getState()).toBe(before);
    });

    it.each(['unknown-id', 'toString', '__proto__', '0'])('returns false and writes nothing for the entry %j', (id) => {
      const before = useAppStore.getState();

      expect(before.removeComponentHistoryEntry(chain.id, id)).toBe(false);
      expect(useAppStore.getState()).toBe(before);
    });

    it('returns false and changes nothing for an entry of another component', () => {
      const before = useAppStore.getState();

      expect(before.removeComponentHistoryEntry(other.id, chain.history[0].id)).toBe(false);
      expect(useAppStore.getState()).toBe(before);
    });

    it('allows a type change once the last conflicting entry is removed', () => {
      const conflicting = [
        addEntryOrFail(chain.id, { ...ENTRY_INPUT, lubricated: '2026-04-12' }),
        addEntryOrFail(chain.id, { ...ENTRY_INPUT, stretch: 0.5 }),
      ];
      const { removeComponentHistoryEntry, updateComponent } = useAppStore.getState();
      const blocked = { ok: false, errors: [{ field: 'type', code: 'notAllowed' }] };

      expect(updateComponent(chain.id, { type: 'cassette' })).toEqual(blocked);
      removeComponentHistoryEntry(chain.id, conflicting[0].id);
      expect(updateComponent(chain.id, { type: 'cassette' })).toEqual(blocked);
      removeComponentHistoryEntry(chain.id, conflicting[1].id);

      expect(updateComponent(chain.id, { type: 'cassette' })).toEqual({
        ok: true,
        component: { ...chain, type: 'cassette', limits: EMPTY_COMPONENT_LIMITS },
      });
    });

    it('makes room for a new entry in a full history', () => {
      seedHistory(chain, COMPONENT_LIMITS.historyMaxCount);

      expect(useAppStore.getState().removeComponentHistoryEntry(chain.id, 'entry-0')).toBe(true);

      expect(useAppStore.getState().addComponentHistoryEntry(chain.id, ENTRY_INPUT).ok).toBe(true);
    });
  });

  it('is emptied by reset', () => {
    addOrFail(CHAIN_INPUT);

    useAppStore.getState().reset();

    expect(useAppStore.getState().components).toEqual({ byId: {}, allIds: [] });
  });
});
