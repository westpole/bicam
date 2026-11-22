# End-to-end tests

Playwright tests for the web build (mobile viewports) and the Electron app. Projects are defined in `playwright.config.ts`.

| Project | Folder | Covers |
| --- | --- | --- |
| `web-mobile-portrait`, `web-mobile-landscape` | `mobile/` | Web app shell on a Pixel 7 (title, i18n fallback, no console errors, no horizontal scroll) |
| `electron-smoke` | `electron/` | App starts, one visible window, loads `build/index.html`, quits on last window close |
| `electron-ui` | `ui/` | Main window layout and light/dark color scheme |
| `electron-integration` | `integration/` | Security posture: no Node globals, `window.open`/navigation blocked, permissions denied, CSP enforced |
| `electron-visual` | `visual/` | Screenshot baselines (Linux/Docker only), light and dark: empty home, open menu, home with the shared bicycle fixtures |

## Running locally

```sh
npm run test:e2e            # all projects
npm run test:e2e:web        # mobile web only
npm run test:e2e:electron   # Electron only
npm run test:e2e:ui         # Playwright UI mode
```

The Playwright `webServer` builds the app in e2e mode (`npm run build:web:e2e`) and serves it with `vite preview`. Electron tests load the same `build/` directly.

Electron tests use the fixture in `fixtures/electron.ts`:

- Each test launches a fresh app with its own temporary `--user-data-dir`. This isolates storage and keeps parallel workers from tripping the app's single-instance lock.
- `ELECTRON_RUN_AS_NODE` is removed from the environment. VS Code sets it, and it would make Electron run as plain Node.
- To seed app state, use `window.__BICAM_E2E_STORE__` (the Zustand store; `setState`/`getState`). `src/e2eHooks.ts` sets it, and `src/main.tsx` calls that only in E2E builds (`vite build --mode e2e`), so production builds never expose it. Reuse the fixtures in `src/**/__mocks__/` rather than inventing new data (see `visual/app.spec.ts`).
- `stubOpenExternal()` replaces `shell.openExternal` in the main process so tests never open the system browser.

On the host, visual tests run but skip snapshot assertions (`ignoreSnapshots` outside Docker).

## Running Tests in Docker

Linux runs that match CI use the images in `docker/e2e/`:

```sh
npm run test:e2e:docker:web
npm run test:e2e:docker:electron
npm run test:e2e:docker                   # both
npm run test:e2e:docker:update-snapshots  # re-record visual baselines
```

- Visual baselines are `*-linux.png` files in `visual/app.spec.ts-snapshots/`. Record them only through Docker, and never commit `*-win32.png` files.
- `PLAYWRIGHT_VERSION` in `docker/e2e/Dockerfile` and `compose.yml` must match the installed `@playwright/test` version. The web image build fails on drift.
- Container-only launch flags (`--no-sandbox`) are applied in the fixture behind `E2E_DOCKER=1`. Never weaken `electron/main.ts` for tests.
