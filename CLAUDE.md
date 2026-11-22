# Bicam

Bicycle components and maintenance journal, shipped as a web app and a Windows Electron desktop app.

Keep changes minimal and aligned with the current repo structure. Prefer updating the owning layer instead of spreading logic across React, the store, and Electron.

## Skills, Agents, and Commands

User-invoked only (never start these on your own):

- `/release-workflow` — production release (preflight, checks, builds, version bump, report).
- `/npm-upgrade <package>` — isolated, verified dependency upgrade.

Run the `code-reviewer` subagent (`.claude/agents/`) before committing. A project Stop hook (`.claude/hooks/review-on-stop.mjs`) asks for this review automatically when a turn leaves unreviewed changes.

## Current Stack

- React 19 for the UI.
- Material UI 9 (Emotion styling engine) for components and theming.
- i18next 26 + react-i18next for translations.
- Zustand 5 for shared app state.
- Vite 8 + TypeScript for the renderer build.
- Electron 45 for the desktop wrapper.
- Storybook 10 and Vitest 5 for component work and testing.

## Code Ownership

- `index.html` is the renderer entry and holds the Content-Security-Policy meta tag (used by both web and Electron `file://` builds).
- `src/main.tsx` bootstraps React, the MUI `ThemeProvider` + `CssBaseline`, and i18n.
- `src/App.tsx` is the root view.
- `src/ui/theme/` owns the MUI theme. Style through the theme and `sx`; Emotion is the styling engine.
- `src/ui/components/**` holds React components and their stories/tests.
- `src/i18n/config.ts` initializes i18next; translations live in `src/i18n/locales/<lng>/translation.json`. Keys are type-checked from the English file via `src/i18n/i18next.d.ts`.
- `src/store/` holds the single global Zustand store: `useAppStore.ts` (menu visibility, active screen), with `types.ts` and `constants.ts` (`INITIAL_APP_STATE`). Only `src/App.tsx` reads it; components get state via props.
- `electron/main.ts` owns the desktop window, app lifecycle, and security handlers. It runs directly via Node type stripping, so use erasable TypeScript only.

## Repo-Specific Patterns

- Use MUI components for UI; do not add another component library or CSS framework.
- All user-facing text goes through `t()`; add keys to the English translation file first.
- Treat Zustand as the integration boundary between React and other layers. Do not duplicate shared state in React local state.
- Before editing, identify the owning layer; if a change crosses layers, update shared store contracts first, then adapters and consumers.
- Stories live beside components in `src/ui/components/**`; use the `storybook-expert` skill instead of inventing a new store-mocking pattern.
- Preserve the existing Electron security posture: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, unless an explicit security-reviewed requirement says otherwise.
- The desktop target is Windows only for now (`build.win` in `package.json`).
- When UI behavior, states, or visuals change, add or update desktop and mobile device stories.

## Verification

- Type check: `npm run typecheck`
- Lint: `npm run lint`
- Narrowest test lane first: `npm run test:react`, `npm run test:store`, `npm run test:electron`, `npm run test:storybook`; then `npm run test:all` for cross-cutting changes.
- Full script reference: `docs/package-scripts.md`.

## Commits

- Format: `<type>: #<ticket> <description>` (for example `feat: #30 add settings overlay`). Take the ticket number from the branch name (`118-...` → `#118`).

## Utilities

- Run `npm run docs:sync-current-stack` to update the Current Stack section in `CLAUDE.md`.
- Revisit this file after updating the Current Stack section to ensure consistency.
