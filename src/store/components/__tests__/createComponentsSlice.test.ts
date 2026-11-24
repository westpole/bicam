import { INITIAL_APP_STATE } from '../../constants';
import { useAppStore } from '../../useAppStore';
import { COMPONENT_TYPES } from '../constants';
import type { BicycleComponent, ComponentInput } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const CHAIN_INPUT: ComponentInput = { type: 'chain', model: 'Shimano CN-M8100' };

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
      expect(result.component).toEqual({ id, type: 'chain', model: 'Shimano CN-M8100', history: [] });
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

  it('is emptied by reset', () => {
    addOrFail(CHAIN_INPUT);

    useAppStore.getState().reset();

    expect(useAppStore.getState().components).toEqual({ byId: {}, allIds: [] });
  });
});
