import { realpathSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test as base, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

/**
 * Repository root with its real on-disk casing (Electron reports `file:///E:/...` even when the shell started in
 * `e:/...`). Electron is launched with it as the app path so `package.json#main` is used.
 */
const repoRoot = realpathSync.native(path.resolve(import.meta.dirname, '..', '..'));

/** URL of the bundled renderer that `electron/main.ts` loads when no `--renderer-url` is given. */
export const bundledRendererUrl = pathToFileURL(path.join(repoRoot, 'build', 'index.html')).href;

type ElectronFixtures = {
  userDataDir: string;
  electronApp: ElectronApplication;
  mainWindow: Page;
};

type OpenExternalRecorder = { __openExternalCalls: string[] };

/**
 * Launches the real Electron app against the prebuilt `build/` (created by the Playwright webServer
 * command locally, or by the Docker image).
 *
 * @param userDataDir - Profile directory. Reuse one, after closing the app, to test what survives a restart.
 * @returns The running app; the caller closes it.
 */
export function launchElectronApp(userDataDir: string): Promise<ElectronApplication> {
  const env = { ...process.env } as Record<string, string>;
  // Set by VS Code and other Electron hosts; it would make Electron run as plain Node.
  delete env.ELECTRON_RUN_AS_NODE;

  const args = [`--user-data-dir=${userDataDir}`, repoRoot];
  // Docker containers lack the user namespaces Chromium's sandbox needs. Container-only; never in main.ts.
  if (process.env.E2E_DOCKER === '1') {
    args.unshift('--no-sandbox');
  }

  return electron.launch({ args, cwd: repoRoot, env });
}

/** Electron fixtures. Each test gets a fresh app instance with its own profile. */
export const test = base.extend<ElectronFixtures>({
  // A fresh profile per test keeps storage isolated and gives each parallel worker its own
  // single-instance lock (the lock is scoped to the user data directory).
  userDataDir: async ({}, use) => {
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'bicam-e2e-'));
    try {
      await use(userDataDir);
    } finally {
      await rm(userDataDir, { recursive: true, force: true, maxRetries: 3 });
    }
  },

  electronApp: async ({ userDataDir }, use) => {
    const app = await launchElectronApp(userDataDir);
    try {
      await use(app);
    } finally {
      await app.close();
    }
  },

  mainWindow: async ({ electronApp }, use) => {
    const mainWindow = await electronApp.firstWindow();
    await mainWindow.waitForLoadState('domcontentloaded');
    await use(mainWindow);
  },
});

/**
 * Replaces `shell.openExternal` in the main process so tests never open the system browser,
 * and records the URLs it was asked to open.
 */
export async function stubOpenExternal(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ shell }) => {
    const calls: string[] = [];
    (globalThis as unknown as OpenExternalRecorder).__openExternalCalls = calls;
    shell.openExternal = async (url: string) => {
      calls.push(url);
    };
  });
}

/** Returns URLs recorded by {@link stubOpenExternal}. */
export function getOpenExternalCalls(app: ElectronApplication): Promise<string[]> {
  return app.evaluate(() => (globalThis as unknown as OpenExternalRecorder).__openExternalCalls);
}

export { expect } from '@playwright/test';
