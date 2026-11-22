import { ScreenPlaceholder } from '../ScreenPlaceholder/ScreenPlaceholder';
import type { BicycleDetailsProps } from './types';

/**
 * Placeholder for the Bicycle details screen, opened from a bicycle card on the home screen. Shows the bicycle's name
 * as the heading. Will hold the bicycle's details, components, and history.
 *
 * @param props - See {@link BicycleDetailsProps}.
 * @returns The titled placeholder screen.
 * @example
 * <BicycleDetails name={selectedBicycle.name} />
 */
export function BicycleDetails({ name }: BicycleDetailsProps) {
  return <ScreenPlaceholder title={name} />;
}
