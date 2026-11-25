import type { ComponentType } from 'react';

import { AddClothesSet } from './AddClothesSet/AddClothesSet';
import { AddComponent } from './AddComponent/AddComponent';
import { BeforeRideCheckIn } from './BeforeRideCheckIn/BeforeRideCheckIn';
import type { PropLessScreen } from './types';

/**
 * The component rendered in `<main>` for each menu screen that needs no props. `home`, `bicycleDetails`, and
 * `addBicycle` have no entry on purpose: `App` renders `Home`, `BicycleDetails`, and `AddBicycle` itself because they
 * need props (the user's bicycles, the selected bicycle, the form callbacks).
 */
export const SCREEN_COMPONENTS: Readonly<Record<PropLessScreen, ComponentType>> = {
  addComponent: AddComponent,
  addClothesSet: AddClothesSet,
  beforeRideCheckIn: BeforeRideCheckIn,
};
