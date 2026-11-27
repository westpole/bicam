import { launchElectronApp, test } from '../fixtures/electron';
import {
  expectAddBicycleFlow,
  expectIncludeComponentFlow,
  expectRestoredBicycle,
  expectRestoredWorkedExample,
  expectWorkedExampleFlow,
} from '../fixtures/shell';

/** Electron integration: app data survives closing and starting the desktop app again. */
test.describe('electron persistence', () => {
  test('restores bicycles and components after a restart', async ({ userDataDir }) => {
    const firstApp = await launchElectronApp(userDataDir);
    try {
      const window = await firstApp.firstWindow();
      await expectAddBicycleFlow(window);
      await expectIncludeComponentFlow(window);
    } finally {
      await firstApp.close();
    }

    const secondApp = await launchElectronApp(userDataDir);
    try {
      await expectRestoredBicycle(await secondApp.firstWindow());
    } finally {
      await secondApp.close();
    }
  });

  test('restores swapped and undone components and their distances after a restart (worked example)', async ({
    userDataDir,
  }) => {
    const firstApp = await launchElectronApp(userDataDir);
    try {
      const window = await firstApp.firstWindow();
      await expectAddBicycleFlow(window);
      await expectWorkedExampleFlow(window);
    } finally {
      await firstApp.close();
    }

    const secondApp = await launchElectronApp(userDataDir);
    try {
      await expectRestoredWorkedExample(await secondApp.firstWindow());
    } finally {
      await secondApp.close();
    }
  });
});
