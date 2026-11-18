---
name: react-frontend-expert
description: Guidelines for building, refactoring, and optimizing React UI screens and components (Vite + MUI) using Zustand for state management.
---

# React Front-End Expert Skill

Use this skill when developing React UI screens and components utilizing Zustand as the state management solution.

## 1. Core Component Architecture

- **Functional Components**: Write all components as functional components using explicit `function MyComponent() {}` syntax.
- **File Structure**: Enforce one component per file. Group features and global state logically. Follow the `file-organization` skill for best practices.
- **Strict Typing**: Always define explicit TypeScript `interface` or `type` for component props and state. Avoid using `any` and prefer precise types to ensure type safety and maintainability. Save types and interfaces in a separate file `types.ts`.
- **Constants**: Define all constant values (e.g., action types, default settings) in a separate `constants.ts` file to maintain consistency and avoid magic numbers or strings throughout the codebase.
- **Tests**: Write unit tests for all components and store logic. Use `Vitest` and `React Testing Library` to ensure components render correctly and state updates behave as expected. Save test files alongside the component or in a dedicated `__tests__` folder.
- **Storybook**: Ensure all new or updated components have corresponding stories in Storybook for visual testing and documentation. Follow the `storybook-expert` skill for best practices.

## 2. Zustand State Management Standards

- **Atomic Selectors**: Always use explicit, atomic selectors when extracting state or actions from a store to prevent unnecessary re-renders.
  - *Correct*: `const user = useAuthStore((state) => state.user)`
  - *Incorrect*: `const { user } = useAuthStore()` (triggers re-renders on any store update)
- **Action Separation**: Define actions alongside state inside the store object to keep mutators close to the data, or use a standalone `actions` object.
- **Immer Integration**: For complex, nested store objects, wrap the store recipe in `immer` middleware to allow safe mutation syntax.
- **State Persistence**: Wrap stores that need to survive page refreshes (e.g., user preferences, UI theme, non-sensitive settings) in the `persist` middleware with a clear storage key. **Never persist authentication tokens, session tokens, or other secrets to `localStorage`** — they are vulnerable to XSS theft (OWASP A02/A07). Tokens must be held in memory only.
- **Resetting State**: Provide a clear `reset()` action in every store to easily wipe data on user logout or session cleanup.

## 3. Local vs. Global State Boundaries

- **Keep Local State Local**: Use standard `useState` for UI-only variables (e.g., dropdown toggle states, modal visibility, form draft inputs) that do not need to be shared globally.
- **Derived State**: Do not sync store state into local `useState`. Compute derived values directly in the component, wrapping them in `useMemo` if the calculation is heavy.

## 4. Performance & Rendering

- **Dependency Arrays**: Maintain perfect accuracy in `useEffect`, `useCallback`, and `useMemo` dependency arrays. Never skip or fake dependencies.
- **No Effects for Fetching**: Do not fetch data inside bare `useEffect` blocks. Combine Zustand with a dedicated client-side cache library like TanStack Query (React Query) for API states.
- **Code Splitting**: Utilize `React.lazy` and `Suspense` to split code at the route level to minimize the initial bundle payload.
- **List Keys**: Never use array indices or the item's string content as `key` props for dynamic lists. Use stable, unique identifier strings (`item.id`). String content keys break reconciliation when items are reordered or deduplicated.
- **Memoization**: Apply `React.memo` to components that receive stable props but re-render due to a parent update. Use `useCallback` to stabilize event handler references passed as props. Reserve `useMemo` for genuinely expensive derivations — do not apply it prematurely.

## 5. Security Standards

- **No `dangerouslySetInnerHTML`**: Never use `dangerouslySetInnerHTML` with any user-controlled or externally sourced string. React's JSX escapes text nodes automatically — rely on that instead.
- **Input Sanitization**: Validate and sanitize all user-supplied input at the point of collection, before it reaches the store or any display path. Apply a whitelist regex where possible:
  ```tsx
  const SAFE_NAME = /^[a-zA-Z0-9 \-_]{1,20}$/;
  const isValid = SAFE_NAME.test(name);
  ```
- **`maxLength` Is Not Enough**: The HTML `maxLength` attribute can be bypassed via DevTools or programmatic input. Always enforce length limits in code as well (`value.slice(0, MAX)` or store-level validation).
- **localStorage Is Public**: Any data written to `localStorage` (via `persist` or directly) is readable and writable by any JavaScript on the page and by the user. Treat it as untrusted on read. Never store secrets, tokens, or integrity-critical data there.
- **No `eval` / `Function` Constructor**: Never use `eval()`, `new Function()`, or `setTimeout`/`setInterval` with string arguments. These open code-injection vectors.
- **Avoid Prototype Pollution**: When merging or spreading user-provided objects into store state, validate keys are not `__proto__`, `constructor`, or `prototype`.

## 6. Accessibility (a11y)

- **Semantic HTML**: Use the correct element for the job (`<button>` for actions, `<a>` for navigation, `<ul>`/`<li>` for lists). Avoid click handlers on `<div>` or `<span>`.
- **Keyboard Navigation**: Every interactive element must be reachable and operable via keyboard. Custom interactive elements (e.g., `<li>` acting as a tab) need `tabIndex`, `role`, `aria-selected`, and `onKeyDown` handlers for `Enter`/`Space`:
  ```tsx
  <li
    role="tab"
    tabIndex={isActive ? 0 : -1}
    aria-selected={isActive}
    onClick={() => setActive(tab)}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActive(tab)}
  >
  ```
- **ARIA Attributes**: Add `aria-label` or `aria-labelledby` to interactive controls that lack visible text. Associate `<label>` with inputs via `htmlFor`/`id`.
- **Focus Management in Modals**: When a modal or overlay opens, move focus to the first focusable element inside it. Trap focus within the modal while it is open. Return focus to the trigger element on close.
- **Color Is Not the Only Indicator**: Never rely solely on color to communicate state (e.g., error, success). Pair color with text, icons, or patterns.

## 7. Styling Standards

The UI is built with Material UI (MUI). Emotion is its styling engine. There are no SCSS files, CSS modules, or other CSS frameworks; do not add them.

- **MUI Components First**: Build with MUI components (`Box`, `Stack`, `Grid`, `Typography`, `Card`, `Button`, `TextField`, `Dialog`, …) before writing custom elements. Import each component from its own path, matching the existing code:
  ```tsx
  import Button from '@mui/material/Button';
  import Stack from '@mui/material/Stack';
  import { useTheme } from '@mui/material/styles';
  ```
- **Theme Is the Single Source of Design Tokens**: Colors, spacing, typography, breakpoints, shape, and component defaults live in `src/ui/theme/index.ts` (`createTheme`). Extend the theme instead of hard-coding values in components.
  - App-wide component defaults and overrides go in `theme.components` (`defaultProps`, `styleOverrides`), not in each usage.
  - Custom palette entries need TypeScript module augmentation next to the theme. Extend both `Palette` (the resolved theme) and `PaletteOptions` (the `createTheme` input), or `createTheme` rejects the new key:
    ```ts
    declare module '@mui/material/styles' {
      interface Palette {
        maintenance: Palette['primary'];
      }
      interface PaletteOptions {
        maintenance?: PaletteOptions['primary'];
      }
    }
    ```
    To use the new color through a component's `color` prop, also augment that component's props overrides (for example `ButtonPropsColorOverrides` in `@mui/material/Button`).
- **`sx` for One-Off Styles**: Use the `sx` prop for styles specific to one usage. Use theme-aware values only: spacing numbers (`p: 2`, `gap: 1`), palette paths (`color: 'text.secondary'`, `bgcolor: 'background.paper'`), and typography variants. Never use raw hex colors or pixel spacing.
  - *Incorrect*: `<Box sx={{ color: '#d32f2f', padding: '16px' }}>`
  - *Correct*: `<Box sx={{ color: 'error.main', p: 2 }}>`
- **Conditional Styles**: Compose with an `sx` array. Falsy entries are ignored, so no class-name utility is needed:
  ```tsx
  <Typography
    variant="h4"
    sx={[
      { fontVariantNumeric: 'tabular-nums' },
      isOverdue && { color: 'error.main' },
      isRetired && { opacity: 0.5 },
    ]}
  >
    {mileage}
  </Typography>
  ```
  When a component accepts an `sx` prop from its parent, merge it rather than overwriting it: `sx={[ownStyles, ...(Array.isArray(sx) ? sx : [sx])]}`.
- **`styled()` for Reusable Styled Parts**: When the same styled element is used in several places, or the styles are large, create it with `styled` from `@mui/material/styles`. If a component accumulates several styled parts, move them into a co-located `ComponentName.styles.ts`; otherwise keep them in the component file. Keep custom props off the DOM with `shouldForwardProp`:
  ```tsx
  import Card from '@mui/material/Card';
  import { styled } from '@mui/material/styles';

  export const ComponentCardRoot = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'retired',
  })<{ retired?: boolean }>(({ theme, retired }) => ({
    padding: theme.spacing(2),
    opacity: retired ? 0.5 : 1,
  }));
  ```
- **Light and Dark Mode**: The theme defines both color schemes and follows the system setting. Use palette tokens, which adapt automatically. For scheme-specific tweaks use `theme.applyStyles('dark', { … })`. Never check `prefers-color-scheme` manually or hard-code colors that only work in one scheme.
- **Responsive Layout**: Style mobile-first with breakpoint objects (`sx={{ flexDirection: { xs: 'column', md: 'row' } }}`). Use `useMediaQuery` only when behavior, not just styling, changes between sizes. Every screen must work at mobile width without horizontal scrolling.
- **Typography Semantics**: Separate visual style from document structure with `variant` and `component`: `<Typography variant="h3" component="h1">`. Keep one `h1` per screen.
- **Avoid the Inline `style` Prop**: Use `sx` or `styled` for all theme-related styling; the React `style` prop bypasses the theme and color schemes. The only exception is a value that changes on nearly every render (for example a computed position or a drag offset). There, `style` avoids generating a new Emotion class each time. Prefer passing it as a CSS variable that `sx` consumes:
  ```tsx
  import type { CSSProperties } from 'react';

  <Box style={{ '--offset': `${offsetPx}px` } as CSSProperties} sx={{ transform: 'translateX(var(--offset))' }} />
  ```
- **Global Styles**: `CssBaseline` (mounted in `src/main.tsx` and `.storybook/preview.tsx`) is the CSS reset. Put any truly global rules in the theme (`components.MuiCssBaseline.styleOverrides`), not in standalone CSS files.
- **Performance**: Hoist static `sx` objects out of the component body (or use `styled`) for components rendered in long lists, so a new style object is not created on every render.
- **CSP**: Emotion injects `<style>` tags at runtime, which the Content-Security-Policy in `index.html` allows through `style-src 'unsafe-inline'`. Do not add stylesheet links from other origins without updating that policy.

## 8. Error Boundaries

- **Wrap UI Regions**: Wrap independent UI regions in `ErrorBoundary` components (e.g., `react-error-boundary`) so a single component crash does not take down the entire app.
- **Placement**: Place boundaries at the top of the component tree in `App.tsx` and around any dynamically loaded (`React.lazy`) sections.
  ```tsx
  import { ErrorBoundary } from 'react-error-boundary';

  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MainLayout />
  </ErrorBoundary>
  ```
- **Fallback UI**: Always provide a minimal, user-friendly `FallbackComponent` — never show a raw error stack in production.

## 9. Verification Checklist

Before completing any task, verify the code against these constraints:
1. Did you use atomic selectors for all Zustand store consumption to avoid render loops?
2. Does the store explicitly type its state and action interface?
3. Are authentication tokens or other secrets absent from `localStorage` / `persist` middleware?
4. Is all user-supplied input validated with a whitelist pattern before entering the store or being rendered?
5. Are all interactive elements keyboard-accessible with correct ARIA roles?
6. Are Error Boundaries in place for critical UI regions?
7. Does the component render without throwing warnings in `React.StrictMode`?
8. Are styles written with MUI components, `sx`, or `styled`, using theme tokens (no raw colors or pixel spacing, no SCSS or CSS files, `style` only for per-render dynamic values)?
9. Does the UI work in both light and dark color schemes and at mobile width?
10. Run `npm run lint` to ensure zero compilation or type-checking errors.
11. Did you update or add relevant documentation to reflect the new or changed functionality? JSDoc comments should be included for all new or modified functions.
12. Did you ensure all new types and constants are added to their respective `types.ts` and `constants.ts` files?
13. Did all new or updated lines have corresponding unit or integration tests to ensure proper coverage? Run `npm run test:react` to verify.
14. Make sure that test coverage is sufficient and meets the repository's thresholds. Follow the `coverage-analysis` skill for best practices.
15. Did you verify that all new or updated components are correctly documented in Storybook? Run `npm run test:storybook` to check.

