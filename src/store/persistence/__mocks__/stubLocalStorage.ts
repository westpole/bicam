/**
 * Replaces the `localStorage` global with one that forwards to the real storage, except for the given methods.
 * happy-dom ignores spies on `Storage.prototype`, so failures are simulated this way. Undo with
 * `vi.unstubAllGlobals()`.
 *
 * @param overrides - Methods to replace.
 * @example
 * stubLocalStorage({ setItem: throwStorageError });
 */
export function stubLocalStorage(
  overrides: Partial<Pick<Storage, 'key' | 'getItem' | 'setItem' | 'removeItem'>>,
): void {
  const real = localStorage;

  vi.stubGlobal('localStorage', {
    get length() {
      return real.length;
    },
    key: (index: number) => real.key(index),
    getItem: (key: string) => real.getItem(key),
    setItem: (key: string, value: string) => real.setItem(key, value),
    removeItem: (key: string) => real.removeItem(key),
    ...overrides,
  });
}

/**
 * Stands in for a storage method that fails, as a full or blocked storage does.
 *
 * @throws Error always.
 */
export function throwStorageError(): never {
  throw new Error('Simulated storage failure');
}
