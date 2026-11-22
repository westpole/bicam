/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

import { aliases } from './aliases.config';

export default defineConfig(({ mode }) => {
  const isE2E = mode === 'e2e';

  return {

  plugins: [react(), ...(mode === 'e2e' ? [] : [viteSingleFile({ removeViteModuleLoader: true })])],
  base: './',
  // Required for Electron file:// protocol in production
  build: {
    outDir: 'build',
    ...(isE2E
      ? {
          rolldownOptions: {
            output: {
              codeSplitting: true,
              manualChunks(id) {
                if (!id.includes('node_modules')) {
                  return;
                }

                if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
                  return 'vendor-react';
                }

                if (id.includes('/@mui/') || id.includes('/@emotion/')) {
                  return 'vendor-mui';
                }

                if (id.includes('/zustand/')) {
                  return 'vendor-zustand';
                }

                return 'vendor';
              },
            },
          },
        }
      : {}),
    rollupOptions: {
      // Exclude specific files from the bundle
      external: [
        // Excludes all files inside any __mocks__ folder
        /.*\/__mocks__\/.*/,
        // Excludes all files inside any __tests__ folder
        /.*\/__tests__\/.*/,
        // Excludes all Storybook files (e.g., button.stories.tsx)
        /.*\.stories\..*/,
      ],
    },
  },
  resolve: {
    // Shared with vitest.config.ts; built from the repo root's real path (see aliases.config.ts).
    alias: aliases,
  },
  server: {
    host: true,      // or '0.0.0.0'
    port: 5173,
    strictPort: true,
  },
    define: {
      __E2E__: mode === 'e2e',
    },
  };
});
