import type { ComponentType } from 'react';

import { AddClothesSet } from './AddClothesSet/AddClothesSet';
import { BeforeRideCheckIn } from './BeforeRideCheckIn/BeforeRideCheckIn';
import type { PropLessScreen } from './types';

/**
 * The component rendered in `<main>` for each menu screen that needs no props. `home`, `bicycleDetails`, `addBicycle`,
 * and `addComponent` have no entry on purpose: `App` renders those screens itself because they need props (the
 * user's bicycles, the selected bicycle, the form callbacks).
 */
export const SCREEN_COMPONENTS: Readonly<Record<PropLessScreen, ComponentType>> = {
  addClothesSet: AddClothesSet,
  beforeRideCheckIn: BeforeRideCheckIn,
};
