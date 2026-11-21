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
}
