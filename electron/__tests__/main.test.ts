import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, shell } from 'electron';

import {
  APP_USER_MODEL_ID,
  bootstrap,
  createMainWindow,
  isAppUrl,
  openExternalSafely,
  resolveRendererUrl,
} from '../main';

type Handler = (...args: unknown[]) => unknown;

/** Returns the handler registered via `on(event, handler)` on a mocked emitter. */
function getHandler(onMock: unknown, event: string): Handler {
  const call = vi.mocked(onMock as (event: string, handler: Handler) => void).mock.calls.find(([name]) => name === event);
  if (!call) {
    throw new Error(`No handler registered for "${event}"`);
  }
  return call[1];
}

function lastWindow() {
  const { results } = vi.mocked(BrowserWindow).mock;
  return results[results.length - 1]?.value as ReturnType<typeof createMainWindow> & {
    webContents: { on: ReturnType<typeof vi.fn>; setWindowOpenHandler: ReturnType<typeof vi.fn> };
  };
}

describe('electron/main', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveRendererUrl', () => {
    it('uses the --renderer-url flag in development', () => {
      const url = resolveRendererUrl(['electron', '.', '--renderer-url=http://localhost:5173'], '/app');
      expect(url.href).toBe('http://localhost:5173/');
    });

    it('rejects non-http(s) renderer URLs', () => {
      expect(() => resolveRendererUrl(['--renderer-url=file:///etc/passwd'], '/app')).toThrow(/non-http/);
    });

    it('falls back to the bundled build/index.html', () => {
      const url = resolveRendererUrl(['electron', '.'], '/app');
      expect(url.href).toBe(pathToFileURL(path.join('/app', 'build', 'index.html')).href);
    });
  });

  describe('isAppUrl', () => {
    const devUrl = new URL('http://localhost:5173/');
    const fileUrl = pathToFileURL(path.join('/app', 'build', 'index.html'));

    it('accepts same-origin URLs for the dev server', () => {
      expect(isAppUrl('http://localhost:5173/settings', devUrl)).toBe(true);
      expect(isAppUrl('https://example.com', devUrl)).toBe(false);
    });

    it('accepts only the bundled index file for file:// builds', () => {
      expect(isAppUrl(`${fileUrl.href}#/profile`, fileUrl)).toBe(true);
      expect(isAppUrl(pathToFileURL('/other.html').href, fileUrl)).toBe(false);
      expect(isAppUrl('https://example.com', fileUrl)).toBe(false);
    });

    it('rejects malformed URLs', () => {
      expect(isAppUrl('not a url', devUrl)).toBe(false);
    });
  });

  describe('openExternalSafely', () => {
    it('opens http(s) links in the system browser', () => {
      openExternalSafely('https://example.com');
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });

    it('ignores other protocols and malformed URLs', () => {
      openExternalSafely('file:///C:/Windows/System32/calc.exe');
      openExternalSafely('not a url');
      expect(shell.openExternal).not.toHaveBeenCalled();
    });
  });

  describe('createMainWindow', () => {
    const rendererUrl = new URL('http://localhost:5173/');

    it('creates a hardened, initially hidden window and loads the renderer', () => {
      const win = createMainWindow(rendererUrl);

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          show: false,
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            webviewTag: false,
          }),
        }),
      );
      expect(win.loadURL).toHaveBeenCalledWith(rendererUrl.href);

      getHandler(win.once, 'ready-to-show')();
      expect(win.show).toHaveBeenCalled();
    });

    it.each(['will-navigate', 'will-redirect'])('blocks foreign %s targets and opens them externally', (event) => {
      createMainWindow(rendererUrl);
      const handler = getHandler(lastWindow().webContents.on, event);

      const foreign = { preventDefault: vi.fn() };
      handler(foreign, 'https://example.com');
      expect(foreign.preventDefault).toHaveBeenCalled();
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');

      const internal = { preventDefault: vi.fn() };
      handler(internal, 'http://localhost:5173/next');
      expect(internal.preventDefault).not.toHaveBeenCalled();
    });

    it('denies new windows and opens them externally', () => {
      createMainWindow(rendererUrl);
      const openHandler = lastWindow().webContents.setWindowOpenHandler.mock.calls[0][0] as Handler;

      expect(openHandler({ url: 'https://example.com' })).toEqual({ action: 'deny' });
      expect(shell.openExternal).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('bootstrap', () => {
    it('quits immediately when another instance holds the lock', () => {
      vi.mocked(app.requestSingleInstanceLock).mockReturnValueOnce(false);

      bootstrap();

      expect(app.quit).toHaveBeenCalled();
      expect(app.on).not.toHaveBeenCalled();
    });

    it('registers Windows lifecycle and security handlers, then creates the window', async () => {
      bootstrap();
      await Promise.resolve();

      expect(app.setAppUserModelId).toHaveBeenCalledWith(APP_USER_MODEL_ID);
      expect(BrowserWindow).toHaveBeenCalledTimes(1);

      getHandler(app.on, 'window-all-closed')();
      expect(app.quit).toHaveBeenCalled();
    });

    it('denies permissions and webviews for every web contents', () => {
      bootstrap();

      const session = {
        setPermissionRequestHandler: vi.fn(),
        setPermissionCheckHandler: vi.fn(),
        setDevicePermissionHandler: vi.fn(),
      };
      const contents = { on: vi.fn(), session };
      getHandler(app.on, 'web-contents-created')({}, contents);

      const attachEvent = { preventDefault: vi.fn() };
      getHandler(contents.on, 'will-attach-webview')(attachEvent);
      expect(attachEvent.preventDefault).toHaveBeenCalled();

      const callback = vi.fn();
      (session.setPermissionRequestHandler.mock.calls[0][0] as Handler)({}, 'media', callback);
      expect(callback).toHaveBeenCalledWith(false);
      expect((session.setPermissionCheckHandler.mock.calls[0][0] as Handler)()).toBe(false);
      expect((session.setDevicePermissionHandler.mock.calls[0][0] as Handler)()).toBe(false);
    });

    it('focuses and restores the existing window on second-instance', () => {
      bootstrap();
      const secondInstance = getHandler(app.on, 'second-instance');

      vi.mocked(BrowserWindow.getAllWindows).mockReturnValueOnce([]);
      expect(() => secondInstance()).not.toThrow();

      const existing = { isMinimized: vi.fn().mockReturnValue(true), restore: vi.fn(), focus: vi.fn() };
      vi.mocked(BrowserWindow.getAllWindows).mockReturnValueOnce([existing as unknown as BrowserWindow]);
      secondInstance();
      expect(existing.restore).toHaveBeenCalled();
      expect(existing.focus).toHaveBeenCalled();
    });
  });
});
