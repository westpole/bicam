import { expect, test } from '../fixtures/electron';

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

  test('light theme', async ({ mainWindow }) => {
    await mainWindow.emulateMedia({ colorScheme: 'light' });
    await expect(mainWindow).toHaveScreenshot('main-window-light.png');
  });

  test('dark theme', async ({ mainWindow }) => {
    await mainWindow.emulateMedia({ colorScheme: 'dark' });
    await expect(mainWindow).toHaveScreenshot('main-window-dark.png');
  });
});
