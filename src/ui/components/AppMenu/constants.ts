import type { SxProps, Theme } from '@mui/material/styles';

import type { AppMenuItemDefinition } from './types';

/** DOM id of the menu panel; `App` passes it to the header as `menuId` so the button can point at it (`aria-controls`). */
export const APP_MENU_ID = 'app-menu';

/** App menu options, top to bottom. */
export const MENU_ITEMS: readonly AppMenuItemDefinition[] = [
  { id: 'addBicycle', labelKey: 'menu.items.addBicycle' },
  { id: 'addComponent', labelKey: 'menu.items.addComponent' },
  { id: 'addClothesSet', labelKey: 'menu.items.addClothesSet' },
  { id: 'beforeRideCheckIn', labelKey: 'menu.items.beforeRideCheckIn' },
];

/** Media query for users who asked the OS to minimize motion; the menu then opens and closes without sliding. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Fills the overlay cell. It is the `Slide` container, so the slide distance is the cell's height and the panel starts
 * just above the cell's top edge, where the overlay box clips it.
 */
export const MENU_CONTAINER_SX: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
};

/** The sliding panel: covers the whole cell, scrolls if the options ever outgrow it, and accepts pointer input. */
export const MENU_PANEL_SX: SxProps<Theme> = {
  height: '100%',
  overflowY: 'auto',
  overscrollBehaviorY: 'contain',
  pointerEvents: 'auto',
  bgcolor: 'background.paper',
};
