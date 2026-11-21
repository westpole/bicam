import { expect, test } from '../fixtures/electron';
import { expectShellLayout } from '../fixtures/shell';

/** Electron UI: layout and theming of the main window. */
test.describe('main window layout', () => {
  test('pins the header and scrolls only <main> at the default window size', async ({ mainWindow }) => {
    await expectShellLayout(mainWindow);
  });

  test('keeps the shell layout after resizing', async ({ electronApp, mainWindow }) => {
    await expect(mainWindow.getByRole('banner')).toBeVisible();

    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setContentSize(480, 640));
    await expect
      .poll(() => mainWindow.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })))
      .toEqual({ width: 480, height: 640 });

    await expectShellLayout(mainWindow);
  });

  test('follows the system dark color scheme', async ({ mainWindow }) => {
    const banner = mainWindow.getByRole('banner');
    await expect(banner).toBeVisible();

    await mainWindow.emulateMedia({ colorScheme: 'light' });
    const lightBackground = await mainWindow.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const lightBanner = await banner.evaluate((element) => getComputedStyle(element).backgroundColor);

    await mainWindow.emulateMedia({ colorScheme: 'dark' });
    await expect
      .poll(() => mainWindow.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .not.toBe(lightBackground);
    await expect
      .poll(() => banner.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(lightBanner);
  });
});
