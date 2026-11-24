import type { MenuScreen } from '@store/types';

/** Menu screens that take no props, so `App` can render them straight from `SCREEN_COMPONENTS`. */
export type PropLessScreen = Exclude<MenuScreen, 'addBicycle'>;
