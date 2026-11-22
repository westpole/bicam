/// <reference types="vite/client" />

// E2E test mode flag (injected by Vite when mode=e2e)
declare const __E2E__: boolean;

interface Window {
  /** The app store, exposed in E2E builds only (see `src/e2eHooks.ts`) so Playwright can seed state. */
  __BICAM_E2E_STORE__?: typeof import('./store/useAppStore').useAppStore;
}
