import { useAppStore } from './store/useAppStore';

/**
 * Exposes test seams for Playwright: puts the app store on `window.__BICAM_E2E_STORE__` so e2e specs can seed state
 * (e.g. the visual snapshots in `e2e/visual/`). This is the only store access outside `src/App.tsx`.
 *
 * Call it only behind the compile-time `__E2E__` flag (see `src/main.tsx`), so production builds drop it.
 */
export function installE2EHooks(): void {
  window.__BICAM_E2E_STORE__ = useAppStore;
}
