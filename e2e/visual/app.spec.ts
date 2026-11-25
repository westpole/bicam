import type { Page } from '@playwright/test';

import en from '../../src/i18n/locales/en/translation.json' with { type: 'json' };
import type { AppStoreState } from '../../src/store/types';
import { BICYCLES, toBicycleCollection } from '../../src/ui/components/screens/Home/__mocks__/bicycles';
import { expect, test } from '../fixtures/electron';

/** Color schemes every scene is captured in. */
const COLOR_SCHEMES = ['light', 'dark'] as const;

/**
 * Seeds the store through the E2E-only hook (`src/e2eHooks.ts`).
 *
 * @param page - The main window.
 * @param seed - Store fields to set. Typed here, because the payload passes through `page.evaluate` unchecked.
 */
async function seedStore(page: Page, seed: Partial<AppStoreState>): Promise<void> {
  await page.evaluate((state) => {
    if (!window.__BICAM_E2E_STORE__) {
      throw new Error('The E2E store hook is missing; build the renderer with `npm run build:web:e2e`');
    }
    window.__BICAM_E2E_STORE__.setState(state);
  }, seed);
}

/**
 * Visual baselines are Linux-only and recorded in Docker (`npm run test:e2e:docker:update-snapshots`).
 * On host runs `ignoreSnapshots` is enabled in playwright.config.ts, so these only assert rendering.
 */
test.describe('main window visuals', () => {
  test.beforeEach(async ({ electronApp, mainWindow }) => {
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setContentSize(1200, 800));
    await expect
      .poll(() => mainWindow.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })))
      .toEqual({ width: 1200, height: 800 });
    await expect(mainWindow.getByRole('banner')).toBeVisible();
    await expect(mainWindow.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
    await mainWindow.evaluate(() => document.fonts.ready.then(() => undefined));
  });

  for (const colorScheme of COLOR_SCHEMES) {
    test.describe(`${colorScheme} theme`, () => {
      test.beforeEach(async ({ mainWindow }) => {
        await mainWindow.emulateMedia({ colorScheme });
      });

      test('empty home', async ({ mainWindow }) => {
        await expect(mainWindow).toHaveScreenshot(`main-window-${colorScheme}.png`);
      });

      test('open menu', async ({ mainWindow }) => {
        await mainWindow.getByRole('button', { name: 'Open menu' }).click();
        const menu = mainWindow.getByRole('navigation', { name: 'Main menu' });
        await expect(menu.getByRole('button')).toHaveCount(Object.keys(en.menu.items).length);
        // The panel slides down from the header; wait until it rests at the header's bottom edge.
        await expect(async () => {
          const header = await mainWindow.getByRole('banner').boundingBox();
          const panel = await menu.boundingBox();
          expect(header && panel && Math.abs(panel.y - (header.y + header.height))).toBeLessThanOrEqual(1);
        }).toPass();
        // Park the pointer outside the menu so no hover state is captured.
        const viewport = await mainWindow.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
        await mainWindow.mouse.move(viewport.width - 1, viewport.height - 1);

        await expect(mainWindow).toHaveScreenshot(`menu-${colorScheme}.png`);
      });

      test('home with bicycles', async ({ mainWindow }) => {
        await seedStore(mainWindow, { bicycle: toBicycleCollection(BICYCLES) });
        const list = mainWindow.getByRole('list', { name: 'Bicycles' });
        await expect(list.getByRole('button')).toHaveCount(BICYCLES.length);
        await expect(list.getByText(en.home.bicycleList.eventsPlaceholder)).toHaveCount(BICYCLES.length);

        await expect(mainWindow).toHaveScreenshot(`home-bicycles-${colorScheme}.png`);
      });

      test('add bicycle form', async ({ mainWindow }) => {
        await seedStore(mainWindow, { activeScreen: 'addBicycle' });
        await expect(
          mainWindow.getByRole('heading', { level: 2, name: en.screens.addBicycle.title }),
        ).toBeVisible();

        await expect(mainWindow).toHaveScreenshot(`add-bicycle-${colorScheme}.png`);
      });

      test('add bicycle form with errors', async ({ mainWindow }) => {
        await seedStore(mainWindow, { activeScreen: 'addBicycle' });
        const { fields, errors } = en.screens.addBicycle;
        const name = mainWindow.getByRole('textbox', { name: fields.name.label });
        await mainWindow.getByRole('textbox', { name: fields.size.label }).fill('M*L');
        // Submit with the keyboard, so no hover state or button ripple is captured.
        await name.press('Enter');
        await expect(mainWindow.getByText(errors.required)).toHaveCount(3);
        await expect(mainWindow.getByText(errors.invalidFormat.size)).toBeVisible();
        // The rejected save focuses the first field; whether it looks focused depends on the OS window focus.
        await name.blur();

        await expect(mainWindow).toHaveScreenshot(`add-bicycle-errors-${colorScheme}.png`);
      });
    });
  }
});
