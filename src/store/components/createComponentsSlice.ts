import type { StateCreator } from 'zustand';

import { definedChanges } from '../common/utilities/definedChanges';
import type { AppStore } from '../types';
import { COMPONENT_LIMITS } from './constants';
import type {
  BicycleComponent,
  ComponentActions,
  ComponentHistoryEntry,
  ComponentHistoryResult,
  ComponentResult,
  ComponentValidationError,
} from './types';
import { createComponentId } from './utilities/createComponentId';
import { createHistoryEntryId } from './utilities/createHistoryEntryId';
import { getDefaultLimits } from './utilities/getDefaultLimits';
import { hasComponent } from './utilities/hasComponent';
import { isBicycleComponentType } from './utilities/isBicycleComponentType';
import { isHistoryValidForType } from './utilities/isHistoryValidForType';
import { normalizeComponentHistoryInput } from './utilities/normalizeComponentHistoryInput';
import { normalizeComponentInput } from './utilities/normalizeComponentInput';
import { validateComponent } from './utilities/validateComponent';
import { validateComponentHistoryEntry } from './utilities/validateComponentHistoryEntry';

/**
 * Creates the component actions for {@link useAppStore}. Data lives in `state.components`; every successful write
 * replaces `components` and the changed `byId` / `allIds` objects, and a failed write does not call `set`.
 *
 * @param set - Zustand `set`.
 * @param get - Zustand `get`.
 * @returns The component actions.
 * @example
 * create<AppStore>()((set, get, api) => ({ ...INITIAL_APP_STATE, ...createComponentsSlice(set, get, api) }));
 */
export const createComponentsSlice: StateCreator<AppStore, [], [], ComponentActions> = (set, get) => ({
  addComponent: (input): ComponentResult => {
    const validation = validateComponent(normalizeComponentInput(input));

    if (!validation.ok) {
      return validation;
    }

    const { type, model } = validation.details;
    const component: BicycleComponent = {
      id: createComponentId(),
      type,
      model,
      label: null,
      initialDistance: 0,
      limits: getDefaultLimits(type),
      usage: [],
      retired: null,
      history: [],
    };

    set((state) => ({
      components: {
        byId: { ...state.components.byId, [component.id]: component },
        allIds: [...state.components.allIds, component.id],
      },
    }));

    return { ok: true, component };
  },

  updateComponent: (id, changes): ComponentResult => {
    const collection = get().components;

    if (!hasComponent(collection, id)) {
      return { ok: false, errors: [{ field: 'id', code: 'notFound' }] };
    }

    const stored = collection.byId[id];
    // normalizeComponentInput picks known fields only, so keys of other stored fields in `changes` are ignored.
    const input = normalizeComponentInput({ ...stored, ...definedChanges(changes) });
    const validation = validateComponent(input);
    // Once the component has been in use, a new type would move its distance to another kind of part.
    const hasTypeConflict =
      input.type !== stored.type &&
      isBicycleComponentType(input.type) &&
      (stored.usage.length > 0 || !isHistoryValidForType(input.type, stored.history));
    const typeErrors: ComponentValidationError[] = hasTypeConflict ? [{ field: 'type', code: 'notAllowed' }] : [];

    // A conflicting type is a known one, so `validation` has no other error for `type`.
    if (!validation.ok) {
      return { ok: false, errors: [...typeErrors, ...validation.errors] };
    }

    if (hasTypeConflict) {
      return { ok: false, errors: typeErrors };
    }

    const { type, model } = validation.details;

    // Nothing to write: keep the stored object, so subscribers are not notified.
    if (type === stored.type && model === stored.model) {
      return { ok: true, component: stored };
    }

    const limits = type === stored.type ? stored.limits : getDefaultLimits(type);
    const component: BicycleComponent = { ...stored, type, model, limits };

    set((state) => ({
      components: { byId: { ...state.components.byId, [id]: component }, allIds: state.components.allIds },
    }));

    return { ok: true, component };
  },

  removeComponent: (id) => {
    if (!hasComponent(get().components, id)) {
      return false;
    }

    set((state) => ({
      components: {
        byId: Object.fromEntries(Object.entries(state.components.byId).filter(([storedId]) => storedId !== id)),
        allIds: state.components.allIds.filter((storedId) => storedId !== id),
      },
    }));

    return true;
  },

  addComponentHistoryEntry: (componentId, input): ComponentHistoryResult => {
    const collection = get().components;

    if (!hasComponent(collection, componentId)) {
      return { ok: false, errors: [{ field: 'componentId', code: 'notFound' }] };
    }

    const stored = collection.byId[componentId];

    if (stored.history.length >= COMPONENT_LIMITS.historyMaxCount) {
      return { ok: false, errors: [{ field: 'history', code: 'tooMany' }] };
    }

    const validation = validateComponentHistoryEntry(stored.type, normalizeComponentHistoryInput(input));

    if (!validation.ok) {
      return validation;
    }

    const entry: ComponentHistoryEntry = { id: createHistoryEntryId(), ...validation.details };
    const component: BicycleComponent = { ...stored, history: [...stored.history, entry] };

    set((state) => ({
      components: { byId: { ...state.components.byId, [componentId]: component }, allIds: state.components.allIds },
    }));

    return { ok: true, entry };
  },

  updateComponentHistoryEntry: (componentId, entryId, changes): ComponentHistoryResult => {
    const collection = get().components;

    if (!hasComponent(collection, componentId)) {
      return { ok: false, errors: [{ field: 'componentId', code: 'notFound' }] };
    }

    const stored = collection.byId[componentId];
    const storedEntry = stored.history.find(({ id }) => id === entryId);

    if (!storedEntry) {
      return { ok: false, errors: [{ field: 'id', code: 'notFound' }] };
    }

    // normalizeComponentHistoryInput picks known fields only, so an `id` key in `changes` is ignored.
    const input = normalizeComponentHistoryInput({ ...storedEntry, ...definedChanges(changes) });
    const validation = validateComponentHistoryEntry(stored.type, input);

    if (!validation.ok) {
      return validation;
    }

    const entry: ComponentHistoryEntry = { id: entryId, ...validation.details };
    const component: BicycleComponent = {
      ...stored,
      history: stored.history.map((other) => (other.id === entryId ? entry : other)),
    };

    set((state) => ({
      components: { byId: { ...state.components.byId, [componentId]: component }, allIds: state.components.allIds },
    }));

    return { ok: true, entry };
  },

  removeComponentHistoryEntry: (componentId, entryId) => {
    const collection = get().components;

    if (!hasComponent(collection, componentId)) {
      return false;
    }

    const stored = collection.byId[componentId];
    const history = stored.history.filter(({ id }) => id !== entryId);

    if (history.length === stored.history.length) {
      return false;
    }

    const component: BicycleComponent = { ...stored, history };

    set((state) => ({
      components: { byId: { ...state.components.byId, [componentId]: component }, allIds: state.components.allIds },
    }));

    return true;
  },
});
