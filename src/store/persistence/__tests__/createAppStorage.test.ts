import type { StorageValue } from 'zustand/middleware';

import { stubLocalStorage, throwStorageError } from '../__mocks__/stubLocalStorage';
import { APP_STORAGE_KEY } from '../constants';
import type { PersistedAppState } from '../types';
import { createAppStorage } from '../utilities/createAppStorage';

/**
 * Builds an empty value to save. Each call has new collection references, like a store update would.
 *
 * @returns The value.
 */
function makeValue(): StorageValue<PersistedAppState> {
  return { state: { bicycle: { byId: {}, allIds: [] }, components: { byId: {}, allIds: [] } }, version: 1 };
}

describe('createAppStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads back what it wrote', () => {
    createAppStorage().setItem(APP_STORAGE_KEY, makeValue());

    expect(createAppStorage().getItem(APP_STORAGE_KEY)).toEqual(makeValue());
  });

  it('returns null when nothing is stored', () => {
    expect(createAppStorage().getItem(APP_STORAGE_KEY)).toBeNull();
  });

  it.each(['{"state":', 'null', '5', '[]', '{}', '{"version":1}', '{"state":null,"version":1}', '{"state":{}}'])(
    'throws for the stored text %s',
    (raw) => {
      localStorage.setItem(APP_STORAGE_KEY, raw);

      expect(() => createAppStorage().getItem(APP_STORAGE_KEY)).toThrow();
    },
  );

  it.each(['bicycle', 'components'] as const)('writes when %s is replaced', (key) => {
    const storage = createAppStorage();
    const value = makeValue();
    storage.setItem(APP_STORAGE_KEY, value);
    localStorage.clear();

    storage.setItem(APP_STORAGE_KEY, { ...value, state: { ...value.state, [key]: { byId: {}, allIds: [] } } });

    expect(localStorage.getItem(APP_STORAGE_KEY)).not.toBeNull();
  });

  it('skips a write when the slices are the ones it last wrote', () => {
    const storage = createAppStorage();
    const value = makeValue();
    storage.setItem(APP_STORAGE_KEY, value);
    localStorage.clear();

    storage.setItem(APP_STORAGE_KEY, { ...value, state: { ...value.state } });

    expect(localStorage.getItem(APP_STORAGE_KEY)).toBeNull();
  });

  it('skips a write when the slices are the ones it last read', () => {
    createAppStorage().setItem(APP_STORAGE_KEY, makeValue());
    const storage = createAppStorage();
    const value = storage.getItem(APP_STORAGE_KEY) as StorageValue<PersistedAppState>;
    localStorage.clear();

    storage.setItem(APP_STORAGE_KEY, { ...value, state: { ...value.state } });

    expect(localStorage.getItem(APP_STORAGE_KEY)).toBeNull();
  });

  it('writes unchanged slices under a new version, so a migration is saved', () => {
    const storage = createAppStorage();
    const value = makeValue();
    storage.setItem(APP_STORAGE_KEY, value);

    storage.setItem(APP_STORAGE_KEY, { ...value, version: 2 });

    expect(storage.getItem(APP_STORAGE_KEY)?.version).toBe(2);
  });

  it('logs a failed write without throwing, and does not try the same slices again', () => {
    const storage = createAppStorage();
    const value = makeValue();
    const setItem = vi.fn(throwStorageError);
    stubLocalStorage({ setItem });

    expect(() => storage.setItem(APP_STORAGE_KEY, value)).not.toThrow();
    storage.setItem(APP_STORAGE_KEY, { ...value, state: { ...value.state } });

    expect(setItem).toHaveBeenCalledOnce();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('tries again, and logs again, when the slices change after a failed write', () => {
    const storage = createAppStorage();
    stubLocalStorage({ setItem: throwStorageError });
    storage.setItem(APP_STORAGE_KEY, makeValue());
    storage.setItem(APP_STORAGE_KEY, makeValue());
    expect(console.error).toHaveBeenCalledTimes(2);

    vi.unstubAllGlobals();
    expect(localStorage.getItem(APP_STORAGE_KEY)).toBeNull();
    storage.setItem(APP_STORAGE_KEY, makeValue());

    expect(localStorage.getItem(APP_STORAGE_KEY)).toBe(JSON.stringify(makeValue()));
  });

  it('logs a failed removal without throwing', () => {
    const storage = createAppStorage();
    stubLocalStorage({ removeItem: throwStorageError });

    expect(() => storage.removeItem(APP_STORAGE_KEY)).not.toThrow();
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('removes the stored text and writes the same slices again afterwards', () => {
    const storage = createAppStorage();
    const value = makeValue();
    storage.setItem(APP_STORAGE_KEY, value);

    storage.removeItem(APP_STORAGE_KEY);
    expect(localStorage.getItem(APP_STORAGE_KEY)).toBeNull();

    storage.setItem(APP_STORAGE_KEY, value);
    expect(localStorage.getItem(APP_STORAGE_KEY)).not.toBeNull();
  });

  it('quarantines the exact stored text under a backup key and stays writable', () => {
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');
    const storage = createAppStorage();

    storage.quarantine(APP_STORAGE_KEY);
    storage.setItem(APP_STORAGE_KEY, makeValue());

    const backupKey = Object.keys(localStorage).find((key) => key.startsWith(`${APP_STORAGE_KEY}:backup:`));
    expect(localStorage.getItem(backupKey ?? '')).toBe('{"broken');
    expect(localStorage.getItem(APP_STORAGE_KEY)).toBe(JSON.stringify(makeValue()));
  });

  it('quarantines nothing when nothing is stored', () => {
    createAppStorage().quarantine(APP_STORAGE_KEY);

    expect(localStorage.length).toBe(0);
  });

  it('backs up the same text once, and different text separately', () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2);
    const getBackups = () =>
      Object.keys(localStorage)
        .filter((key) => key.startsWith(`${APP_STORAGE_KEY}:backup:`))
        .map((key) => localStorage.getItem(key))
        .sort();

    localStorage.setItem(APP_STORAGE_KEY, '{"broken');
    createAppStorage().quarantine(APP_STORAGE_KEY);
    createAppStorage().quarantine(APP_STORAGE_KEY);
    expect(getBackups()).toEqual(['{"broken']);

    localStorage.setItem(APP_STORAGE_KEY, '{"other');
    createAppStorage().quarantine(APP_STORAGE_KEY);
    expect(getBackups()).toEqual(['{"broken', '{"other']);
  });

  it('does not take the same text under an unrelated key for a backup', () => {
    localStorage.setItem('unrelated', '{"broken');
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');

    createAppStorage().quarantine(APP_STORAGE_KEY);

    expect(localStorage.length).toBe(3);
  });

  it('never overwrites the stored text when the existing backups could not be checked', () => {
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');
    const storage = createAppStorage();
    const key = vi.fn(throwStorageError);
    stubLocalStorage({ key });

    storage.quarantine(APP_STORAGE_KEY);
    vi.unstubAllGlobals();
    storage.setItem(APP_STORAGE_KEY, makeValue());

    expect(key).toHaveBeenCalledOnce();
    expect(localStorage.getItem(APP_STORAGE_KEY)).toBe('{"broken');
    expect(console.error).toHaveBeenCalledOnce();
  });

  it('never overwrites or removes the stored text when it could not be backed up', () => {
    localStorage.setItem(APP_STORAGE_KEY, '{"broken');
    const storage = createAppStorage();
    stubLocalStorage({ setItem: throwStorageError });

    storage.quarantine(APP_STORAGE_KEY);
    vi.unstubAllGlobals();
    storage.setItem(APP_STORAGE_KEY, makeValue());
    storage.removeItem(APP_STORAGE_KEY);

    expect(localStorage.getItem(APP_STORAGE_KEY)).toBe('{"broken');
    expect(console.error).toHaveBeenCalledOnce();
  });
});
