import { realpathSync } from 'node:fs';
import path from 'node:path';

/**
 * Repo root with its real on-disk casing. Vite canonicalizes module ids the same way, so on Windows a shell
 * started in `e:\...` still yields `E:/...` here. If alias targets used a different drive-letter case than
 * Vite's own ids, `node_modules` would resolve under two paths and bundle a duplicate React/MUI (blank app).
 *
 * `realpathSync` also resolves symlinks/junctions. That matches Vite, which resolves symlinks by default
 * (`resolve.preserveSymlinks: false`) and has no custom `root` here. The root always exists, unlike empty
 * alias folders such as `src/store`, so only the root is resolved.
 */
const repoRoot = realpathSync.native(import.meta.dirname);

/** Import aliases shared by `vite.config.ts` (app, Storybook) and `vitest.config.ts`; mirror them in `tsconfig.json`. */
export const aliases = {
  '@electron': path.join(repoRoot, 'electron'),
  '@store': path.join(repoRoot, 'src/store'),
  '@ui': path.join(repoRoot, 'src/ui'),
  '@shared': path.join(repoRoot, 'src/shared'),
  '@assets': path.join(repoRoot, 'src/assets'),
};
