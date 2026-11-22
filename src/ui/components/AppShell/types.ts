import type { ReactNode } from 'react';

/** Props for {@link AppShell}. */
export interface AppShellProps {
  /** Content of the pinned top row, usually `<AppHeader />`. */
  header: ReactNode;
  /**
   * Content of the scrollable `<main>` viewport. Optional on purpose (the ticket sketch had it required) so
   * `App` can render an empty shell until real screens land.
   */
  children?: ReactNode;
  /**
   * Content layered over `<main>` in the same grid cell, below the header (for example `<AppMenu />`). `null` or `undefined` renders no overlay box. The slot box
   * clips its content and lets clicks through to `<main>`; the content opts back in with `pointerEvents: 'auto'`.
   */
  overlay?: ReactNode;
  /** Whether the overlay currently covers `<main>`. While `true`, `<main>` is `inert`. Default `false`. */
  overlayOpen?: boolean;
}
