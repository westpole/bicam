import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures/electron';

/** Returns how far the element's center is from the viewport center, in px. */
async function offsetFromCenter(page: Page, locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
  if (!box) {
    throw new Error('Element has no bounding box');
  }
  return {
    x: Math.abs(box.x + box.width / 2 - viewport.width / 2),
    y: Math.abs(box.y + box.height / 2 - viewport.height / 2),
  };
}

/** Electron UI: layout and theming of the main window. */
test.describe('main window layout', () => {
  test('centers the title in the window', async ({ mainWindow }) => {
    const heading = mainWindow.getByRole('heading', { level: 1, name: 'Bicam' });
    await expect(heading).toBeVisible();

    const offset = await offsetFromCenter(mainWindow, heading);
    expect(offset.x).toBeLessThan(2);
    expect(offset.y).toBeLessThan(2);
  });

  test('keeps the title centered after resizing', async ({ electronApp, mainWindow }) => {
    const heading = mainWindow.getByRole('heading', { level: 1, name: 'Bicam' });
    await expect(heading).toBeVisible();

    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.setContentSize(480, 640));
    await expect.poll(() => mainWindow.evaluate(() => window.innerWidth)).toBe(480);

    const offset = await offsetFromCenter(mainWindow, heading);
    expect(offset.x).toBeLessThan(2);
    expect(offset.y).toBeLessThan(2);
  });

  test('follows the system dark color scheme', async ({ mainWindow }) => {
    await expect(mainWindow.getByRole('heading', { level: 1 })).toBeVisible();

    await mainWindow.emulateMedia({ colorScheme: 'light' });
    const lightBackground = await mainWindow.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await mainWindow.emulateMedia({ colorScheme: 'dark' });
    await expect
      .poll(() => mainWindow.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .not.toBe(lightBackground);
  });
});
