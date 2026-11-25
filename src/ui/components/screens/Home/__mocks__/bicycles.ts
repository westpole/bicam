import type { Bicycle, BicycleCollection } from '@store/bicycle/types';

/**
 * Builds a valid bicycle fixture.
 *
 * @param id - The bicycle id (fixtures use readable ids instead of UUIDs).
 * @param name - The bicycle name.
 * @returns A bicycle with the required fields filled in and optional fields empty.
 */
function makeBicycle(id: string, name: string): Bicycle {
  return {
    id,
    name,
    company: 'Canyon',
    model: 'Grizl CF SL 7',
    purchased: null,
    size: null,
    frameGeometry: null,
    components: [],
    odometer: 0,
    odometerDate: null,
  };
}

/** Three bicycles in display order, for stories and tests. */
export const BICYCLES: readonly Bicycle[] = [
  makeBicycle('bike-gravel', 'Gravel Grinder'),
  makeBicycle('bike-road', 'Roadie'),
  makeBicycle('bike-commute', 'Commuter'),
];

/** A bicycle with a 40-character name, the longest the store allows. */
export const LONG_NAME_BICYCLE: Bicycle = makeBicycle('bike-long', 'Commuter with a very long name for tests');

/** Twelve bicycles: more than fit on a phone screen, so `<main>` has to scroll. */
export const MANY_BICYCLES: readonly Bicycle[] = Array.from({ length: 12 }, (_, index) =>
  makeBicycle(`bike-${index + 1}`, `Bicycle ${index + 1}`),
);

/**
 * Turns a list of bicycles into the store's normalized collection, keeping the list order.
 *
 * @param bicycles - Bicycles in display order.
 * @returns The `bicycle` slice value.
 */
export function toBicycleCollection(bicycles: readonly Bicycle[]): BicycleCollection {
  return {
    byId: Object.fromEntries(bicycles.map((bicycle) => [bicycle.id, bicycle])),
    allIds: bicycles.map((bicycle) => bicycle.id),
  };
}
