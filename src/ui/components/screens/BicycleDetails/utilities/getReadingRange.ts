import type { ComponentUsage, StartRange } from '@store/components/types';

/**
 * Finds the odometer readings a care entry of a component in use can be dated at: from its current installation
 * (`odometer − distanceSinceInstalled`) to the bicycle's odometer. Before the installation the component may not have
 * run, so its distance then cannot be derived from the odometer.
 *
 * @param usage - The component's usage (`getComponentUsage`).
 * @param odometer - The bicycle's current odometer.
 * @returns The range, or `null` for a resting component, which has no reading.
 * @example
 * getReadingRange({ distanceSinceInstalled: 1400 }, 4500); // { min: 3100, max: 4500 }
 */
export function getReadingRange(
  usage: Pick<ComponentUsage, 'distanceSinceInstalled'>,
  odometer: number,
): StartRange | null {
  if (usage.distanceSinceInstalled === null) {
    return null;
  }

  // Rounded to 1 decimal, so floating-point differences such as `3100.5 - 1400.2` stay exact.
  return { min: Math.round((odometer - usage.distanceSinceInstalled) * 10) / 10, max: odometer };
}
