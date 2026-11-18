import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, shell } from 'electron';

/**
 * Electron main process (Windows-only for now).
 *
 * Runs directly through Node's type stripping, so only erasable TypeScript syntax is allowed here
 * (no enums, namespaces, or parameter properties). See `erasableSyntaxOnly` in tsconfig.json.
 */

/** Windows AppUserModelID; must match `build.appId` in package.json for taskbar grouping and notifications. */
export const APP_USER_MODEL_ID = 'com.iwestpole.bicam';
const RENDERER_URL_FLAG = '--renderer-url=';

/** Resolves the renderer entry: the Vite dev server (`--renderer-url=`) or the bundled `build/index.html`. */
export function resolveRendererUrl(argv: readonly string[], appPath: string): URL {
  const flag = argv.find((arg) => arg.startsWith(RENDERER_URL_FLAG));

  if (flag) {
    const devUrl = new URL(flag.slice(RENDERER_URL_FLAG.length));
    if (devUrl.protocol !== 'http:' && devUrl.protocol !== 'https:') {
      throw new Error(`Refusing to load a non-http(s) renderer URL: ${devUrl.href}`);
    }
    return devUrl;
  }

  return pathToFileURL(path.join(appPath, 'build', 'index.html'));
}

/** True when `url` points at the app's own renderer (same http origin, or the same local index file). */
export function isAppUrl(url: string, rendererUrl: URL): boolean {
  try {
    const target = new URL(url);
    if (rendererUrl.protocol === 'file:') {
      return target.protocol === 'file:' && target.pathname === rendererUrl.pathname;
    }
    return target.origin === rendererUrl.origin;
  } catch {
    return false;
  }
}

/** Opens only http(s) links in the system browser; anything else is ignored. */
export function openExternalSafely(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol === 'http:' || protocol === 'https:') {
      void shell.openExternal(url);
    }
  } catch {
    // Ignore malformed URLs.
  }
}

export function createMainWindow(rendererUrl: URL): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    title: app.getName(),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  const blockForeignNavigation = (event: { preventDefault: () => void }, url: string): void => {
    if (!isAppUrl(url, rendererUrl)) {
      event.preventDefault();
      openExternalSafely(url);
    }
  };

  mainWindow.webContents.on('will-navigate', blockForeignNavigation);
  mainWindow.webContents.on('will-redirect', blockForeignNavigation);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafely(url);
    return { action: 'deny' };
  });

  void mainWindow.loadURL(rendererUrl.href);

  return mainWindow;
}

export function bootstrap(): void {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.setAppUserModelId(APP_USER_MODEL_ID);

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault());
    contents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    contents.session.setPermissionCheckHandler(() => false);
    contents.session.setDevicePermissionHandler(() => false);
  });

  app.on('second-instance', () => {
    const [mainWindow] = BrowserWindow.getAllWindows();
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  // Windows-only target: closing the last window always quits (no macOS dock behavior).
  app.on('window-all-closed', () => app.quit());

  void app.whenReady().then(() => {
    createMainWindow(resolveRendererUrl(process.argv, app.getAppPath()));
  });
}

// Skip side effects when imported by unit tests.
if (!process.env.VITEST) {
  bootstrap();
}
