import type { ComponentType } from 'react';

import type { MenuScreen } from '@store/types';

import { AddBicycle } from './AddBicycle/AddBicycle';
import { AddClothesSet } from './AddClothesSet/AddClothesSet';
import { AddComponent } from './AddComponent/AddComponent';
import { BeforeRideCheckIn } from './BeforeRideCheckIn/BeforeRideCheckIn';

/**
 * The component rendered in `<main>` for each screen reachable from the app menu. `home` and `bicycleDetails` have
 * no entry on purpose: `App` renders `Home` and `BicycleDetails` itself because they need props (the user's bicycles,
 * the selected bicycle).
 */
export const SCREEN_COMPONENTS: Readonly<Record<MenuScreen, ComponentType>> = {
  addBicycle: AddBicycle,
  addComponent: AddComponent,
  addClothesSet: AddClothesSet,
  beforeRideCheckIn: BeforeRideCheckIn,
};
