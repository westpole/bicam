import { launchElectronApp, test } from '../fixtures/electron';
import { expectAddBicycleFlow, expectIncludeComponentFlow, expectRestoredBicycle } from '../fixtures/shell';

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
});
