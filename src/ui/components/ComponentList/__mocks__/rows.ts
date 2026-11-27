import type { BicycleComponent, ComponentUsage } from '@store/components/types';

import type { ComponentRow } from '../types';
import { ALL_TYPE_COMPONENTS, COMPONENTS, LONG_MODEL_COMPONENT } from './components';

/** Usage of a component that rests and was never used: no distance, no care. */
export const RESTING_USAGE: Readonly<ComponentUsage> = {
  distance: 0,
  distanceSinceInstalled: null,
  isInUse: false,
  stretch: null,
  lubricant: null,
  distanceSinceLubrication: null,
  distanceSinceCleaning: null,
};

/**
 * Builds a row. The usage is given as shown; it does not have to match the component's periods.
 *
 * @param component - The component.
 * @param usage - Usage values that differ from {@link RESTING_USAGE}.
 * @returns The row.
 * @example
 * toRow(chain, { isInUse: true, distance: 1500, distanceSinceInstalled: 1400 });
 */
export function toRow(component: BicycleComponent, usage: Partial<ComponentUsage> = {}): ComponentRow {
  return { component, usage: { ...RESTING_USAGE, ...usage } };
}

const [chain, wheel, tape] = COMPONENTS;

/** A chain in use, cared for with wax, that is due for cleaning (default limits: 0.5 %, 300 km, 1500 km). */
export const CHAIN_IN_USE_ROW: ComponentRow = toRow(
  { ...chain, label: 'A' },
  {
    isInUse: true,
    distance: 2900,
    distanceSinceInstalled: 1400,
    stretch: 0.3,
    lubricant: 'wax',
    distanceSinceLubrication: 250,
    distanceSinceCleaning: 1550,
  },
);

/** A wheel in use since the bicycle's first kilometre. */
export const WHEEL_IN_USE_ROW: ComponentRow = toRow(wheel, {
  isInUse: true,
  distance: 4500,
  distanceSinceInstalled: 4500,
});

/** A labelled bar tape that rests. */
export const TAPE_RESTING_ROW: ComponentRow = toRow({ ...tape, label: 'Red' }, { distance: 812.4 });

/** A chain that rests and was never cared for: every care value is unknown. */
export const CHAIN_RESTING_ROW: ComponentRow = toRow({ ...chain, id: 'component-chain-b', label: 'B' }, { distance: 1600 });

/** Rows in display order: two in use, two resting. */
export const ROWS: readonly ComponentRow[] = [CHAIN_IN_USE_ROW, WHEEL_IN_USE_ROW, TAPE_RESTING_ROW, CHAIN_RESTING_ROW];

/** The longest allowed model and label, and the largest distances, on one row. */
export const LONG_ROW: ComponentRow = toRow(
  { ...LONG_MODEL_COMPONENT, type: 'chain', label: 'L'.repeat(20), limits: { ...chain.limits } },
  {
    isInUse: true,
    distance: 1_000_000,
    distanceSinceInstalled: 500_000,
    stretch: 4.75,
    lubricant: 'oil',
    distanceSinceLubrication: 123_456.7,
    distanceSinceCleaning: 499_999.9,
  },
);

/** One resting row per component type. */
export const ALL_TYPE_ROWS: readonly ComponentRow[] = ALL_TYPE_COMPONENTS.map((component) => toRow(component));
