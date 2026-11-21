import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { playwright } from '@vitest/browser-playwright';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { aliases } from './aliases.config';

const dirname = import.meta.dirname;

const isElectronOnlyRun = process.argv.some((arg, index, argv) => {
  return arg === '--project=electron' || (arg === '--project' && argv[index + 1] === 'electron');
});
const shouldPrintStdout = ['1', 'true', 'yes', 'on'].includes(
  (process.env.VITEST_PRINT_STDOUT || '').toLowerCase(),
);

const defaultCoverageThresholds = {
  // Global fallback thresholds if files don't match specific globs below
  statements: 60,
  branches: 60,
  functions: 60,
  lines: 60,

  // Target: React UI components (High coverage requirement)
  'src/ui/**': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
  'src/App.tsx': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },

  // Target: pure utilities (fully deterministic, full coverage required)
  'src/utilities/**/*.ts': {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100
  },
  // Target: Electron main process (Critical for app stability, high coverage required)
  'electron/**/*.ts': {
    lines: 90,
    branches: 90,
    functions: 90,
    statements: 90
  },

  // Zustand store coverage (State management logic, should be well-tested)
  'src/store/**/*.ts': {
    branches: 90,
  },
};

const electronCoverageThresholds = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
};

export default defineConfig({
  resolve: {
    alias: aliases,
  },
  define: {
    // Mirrors vite.config.ts: unit tests run as a production (non-E2E) build.
    __E2E__: false,
  },
  test: {
    globals: true,
    onConsoleLog(_log, type) {
      if (type === 'stdout' && !shouldPrintStdout) {
        return false;
      }
    },

    reporters: [
      'default',
      ['html', { outputDir: './reports/unit-tests' }],
    ],

    // 1. GLOBAL COVERAGE MANAGEMENT
    // Configured here because Vitest aggregates coverage globally across projects.
    coverage: {
      provider: 'v8',
      enabled: false,
      reportsDirectory: './reports/unit-tests/coverage',
      include: ['src/**/*.{ts,tsx}', 'electron/**/*.ts'],
      reporter: [
        'text',             // Prints a compact table directly to the console
        'json',             // Outputs data for CI tools (SonarQube, etc.)
        'html',             // Generates an interactive local browser report
      ],
      exclude: [
        'src/**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/.storybook/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        'electron/__tests__/**',
        'src/config.ts',
        'src/shared/**',
        'src/main.tsx',
        'src/assets/**',
        '**/*.json',
      ],

      thresholds: isElectronOnlyRun ? electronCoverageThresholds : defaultCoverageThresholds,
    },

    // 2. ISOLATED TEST PROJECTS CONFIGURATION
    // Keeps execution environments totally independent of one another.
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'react',
          environment: 'happy-dom',
          setupFiles: ['./vitest-react.setup.ts'],
          include: ['src/ui/**/*.{test,spec}.{ts,tsx}', 'src/__tests__/**/*.{test,spec}.{ts,tsx}'],
        }
      },
      {
        extends: true,
        test: {
          name: 'platform',
          environment: 'happy-dom',
          include: ['src/platform/**/*.test.ts'],
        }
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'store',
          environment: 'happy-dom',
          setupFiles: ['./vitest-react.setup.ts'],
          include: ['src/store/**/*.test.ts'],
        }
      },
      {
        extends: true,
        test: {
          name: 'shared',
          environment: 'happy-dom',
          include: ['src/shared/**/*.test.ts'],
        }
      },
      {
        extends: true,
        test: {
          name: 'electron',
          setupFiles: ['./vitest-electron.setup.ts'],
          include: ['electron/**/*.test.ts'],
          environment: 'node', // Electron main/preload tests run in Node.js
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
        },
      }
    ]
  },
});
