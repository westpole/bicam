import { installE2EHooks } from '../e2eHooks';
import { useAppStore } from '../store/useAppStore';

describe('installE2EHooks', () => {
  afterEach(() => {
    delete window.__BICAM_E2E_STORE__;
  });

  it('exposes the app store on window for Playwright', () => {
    expect(window.__BICAM_E2E_STORE__).toBeUndefined();

    installE2EHooks();

    expect(window.__BICAM_E2E_STORE__).toBe(useAppStore);
  });
});
