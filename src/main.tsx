import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';

import './i18n/config';
import { App } from './App';
import { installE2EHooks } from './e2eHooks';
import { theme } from '@ui/theme';

// E2E builds only (`vite build --mode e2e`). `__E2E__` is false in production builds, so this branch is removed.
if (__E2E__) {
  installE2EHooks();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    {/* The app never renders on a server, so `noSsr` lets `useColorScheme` report the stored or system scheme on the
        first render instead of `undefined` until mount (which briefly showed the wrong theme toggle icon). */}
    <ThemeProvider theme={theme} noSsr>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);
