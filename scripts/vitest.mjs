/**
 * Starts the Vitest CLI with a normalized working directory. All `test:*` npm scripts go through this file.
 *
 * Why: on Windows, a shell whose cwd has a lower-case drive letter (`e:\...`, as VS Code often opens a workspace)
 * makes Vitest load itself twice. The CLI and its workers load from `e:/...`, while test and setup-file imports of
 * `vitest` resolve through the project root, which Vitest normalizes to `E:/...`. Node caches ES modules by URL, so
 * these are two separate instances. Setup files that `import { vi, expect } from 'vitest'` then change a different
 * `vi`/`expect` than the globals the tests use: `vi.clearAllMocks()` misses the setup's mocks, and jest-dom matchers
 * are missing. Starting Vitest from the upper-case path keeps a single instance. See tickets/5-fix-failing-unit-tests.md.
 *
 * Usage: `node scripts/vitest.mjs <vitest args...>`. Arguments, exit code and stdio are passed through unchanged.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

/** Upper-cases a Windows drive letter (`e:\x` → `E:\x`); returns other paths unchanged. */
function normalizeDriveLetter(dir) {
  return process.platform === 'win32' ? dir.replace(/^[a-z]:/, (drive) => drive.toUpperCase()) : dir;
}

const cwd = normalizeDriveLetter(process.cwd());
const require = createRequire(path.join(cwd, 'package.json'));
const vitestBin = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');

const child = spawn(process.execPath, [vitestBin, ...process.argv.slice(2)], { cwd, stdio: 'inherit' });

child.on('error', (error) => {
  console.error(`scripts/vitest.mjs: failed to start Vitest (${vitestBin}): ${error.message}`);
  process.exit(1);
});

// Ctrl+C reaches the child directly (same console / process group), so only wait for it to exit; forwarding SIGINT
// would deliver it twice (and in watch/ui mode a second Ctrl+C forces an immediate exit).
process.on('SIGINT', () => {});
// A targeted SIGTERM (CI timeout, `kill <pid>`) reaches only this process, so forward it to the child.
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});

child.on('exit', (code, signal) => {
  // Shell convention for signal deaths: 128 + signal number (fallback 1 if unknown).
  process.exit(code ?? (signal ? 128 + (os.constants.signals[signal] ?? -127) : 0));
});
