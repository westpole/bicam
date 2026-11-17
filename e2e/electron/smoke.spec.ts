import { bundledRendererUrl, expect, test } from '../fixtures/electron';

/** Electron smoke: the app starts and shows its single main window. */
test.describe('electron smoke', () => {
  test('opens one window showing the project name', async ({ electronApp, mainWindow }) => {
    await expect(mainWindow.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
    await expect(mainWindow).toHaveTitle('Bicam');
    expect(electronApp.windows()).toHaveLength(1);
  });

  test('loads the bundled renderer from build/index.html', async ({ mainWindow }) => {
    expect(mainWindow.url()).toBe(bundledRendererUrl);
  });

  test('shows the window once it is ready', async ({ electronApp, mainWindow }) => {
    await expect(mainWindow.getByRole('heading', { level: 1 })).toBeVisible();

    await expect
      .poll(() => electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.isVisible()))
      .toBe(true);
  });

  test('quits when the last window is closed', async ({ electronApp, mainWindow }) => {
    await expect(mainWindow.getByRole('heading', { level: 1 })).toBeVisible();

    const closed = new Promise<void>((resolve) => electronApp.on('close', () => resolve()));
    await electronApp.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close());

    await expect(closed).resolves.toBeUndefined();
  });
});
