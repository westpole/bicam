/**
 * Checks whether `localStorage` already holds a backup with exactly this text. The same unreadable data is found again
 * on every start until something is saved over it, and needs only one backup.
 *
 * @param prefix - What every backup key starts with.
 * @param raw - The text to look for.
 * @returns `true` when a backup with this text exists.
 * @example
 * hasBackup('bicam-app-store:backup:', '{"broken'); // false before the first backup
 */
export function hasBackup(prefix: string, raw: string): boolean {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith(prefix) && localStorage.getItem(key) === raw) {
      return true;
    }
  }

  return false;
}
