/** `localStorage` key of the saved app data. */
export const APP_STORAGE_KEY = 'bicam-app-store';

/**
 * Version of the saved data shape. Raise it with every change to a persisted entity, and teach
 * `migratePersistedState` to upgrade the previous version.
 */
export const APP_STORAGE_VERSION = 1;
