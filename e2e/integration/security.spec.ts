import { bundledRendererUrl, expect, getOpenExternalCalls, stubOpenExternal, test } from '../fixtures/electron';

/** Electron integration: main-process security handlers as observed from the renderer. */
test.describe('electron security posture', () => {
  test.beforeEach(async ({ electronApp, mainWindow }) => {
    await stubOpenExternal(electronApp);
    await expect(mainWindow.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('exposes no Node.js globals to the renderer', async ({ mainWindow }) => {
    const globals = await mainWindow.evaluate(() => {
      const scope = globalThis as Record<string, unknown>;
      return { require: typeof scope.require, process: typeof scope.process, module: typeof scope.module };
    });

    expect(globals).toEqual({ require: 'undefined', process: 'undefined', module: 'undefined' });
  });

  test('denies window.open and hands http(s) links to the system browser', async ({ electronApp, mainWindow }) => {
    const opened = await mainWindow.evaluate(() => window.open('https://example.com/docs') !== null);

    expect(opened).toBe(false);
    expect(electronApp.windows()).toHaveLength(1);
    await expect.poll(() => getOpenExternalCalls(electronApp)).toEqual(['https://example.com/docs']);
  });

  test('blocks navigation away from the app and opens it externally', async ({ electronApp, mainWindow }) => {
    await mainWindow.evaluate(() => {
      window.location.href = 'https://example.com/elsewhere';
    });

    await expect.poll(() => getOpenExternalCalls(electronApp)).toEqual(['https://example.com/elsewhere']);
    expect(mainWindow.url()).toBe(bundledRendererUrl);
  });

  test('never opens non-http(s) links externally', async ({ electronApp, mainWindow }) => {
    await mainWindow.evaluate(() => window.open('file:///C:/Windows/System32/calc.exe'));
    await mainWindow.evaluate(() => window.open('https://example.com/after'));

    // The https call proves the handler ran; the file:// one must have been dropped.
    await expect.poll(() => getOpenExternalCalls(electronApp)).toEqual(['https://example.com/after']);
  });

  test('denies permission requests', async ({ mainWindow }) => {
    const permission = await mainWindow.evaluate(() => Notification.requestPermission());

    expect(permission).toBe('denied');
  });

  test('enforces the Content-Security-Policy for remote connections', async ({ mainWindow }) => {
    const violatedDirective = await mainWindow.evaluate(
      () =>
        new Promise<string>((resolve) => {
          document.addEventListener('securitypolicyviolation', (event) => resolve(event.effectiveDirective), {
            once: true,
          });
          fetch('https://example.com/data.json').catch(() => undefined);
        }),
    );

    expect(violatedDirective).toBe('connect-src');
  });
});
