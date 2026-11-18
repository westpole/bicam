import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test as base, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';

/** Repository root; Electron is launched with it as the app path so `package.json#main` is used. */
const repoRoot = path.resolve(import.meta.dirname, '..', '..');

/** URL of the bundled renderer that `electron/main.ts` loads when no `--renderer-url` is given. */
export const bundledRendererUrl = pathToFileURL(path.join(repoRoot, 'build', 'index.html')).href;

type ElectronFixtures = {
  electronApp: ElectronApplication;
  mainWindow: Page;
};

type OpenExternalRecorder = { __openExternalCalls: string[] };

/**
 * Launches the real Electron app against the prebuilt `build/` (created by the Playwright webServer
 * command locally, or by the Docker image). Each test gets a fresh app instance.
 */
export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const env = { ...process.env } as Record<string, string>;
    // Set by VS Code and other Electron hosts; it would make Electron run as plain Node.
    delete env.ELECTRON_RUN_AS_NODE;

    // A fresh profile per test keeps storage isolated and gives each parallel worker its own
    // single-instance lock (the lock is scoped to the user data directory).
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'bicam-e2e-'));
    const args = [`--user-data-dir=${userDataDir}`, repoRoot];
    // Docker containers lack the user namespaces Chromium's sandbox needs. Container-only; never in main.ts.
    if (process.env.E2E_DOCKER === '1') {
      args.unshift('--no-sandbox');
    }

    const app = await electron.launch({ args, cwd: repoRoot, env });
    try {
      await use(app);
    } finally {
      await app.close();
      await rm(userDataDir, { recursive: true, force: true, maxRetries: 3 });
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
