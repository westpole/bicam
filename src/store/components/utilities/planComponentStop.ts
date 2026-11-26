import type { BicycleCollection } from '../../bicycle/types';
import { hasBicycle } from '../../bicycle/utilities/hasBicycle';
import type { ComponentCollection, ComponentId, ComponentStopInput, ComponentUsagePlan } from '../types';
import { findOpenPeriod } from './findOpenPeriod';
import { hasComponent } from './hasComponent';
import { toUsageErrors } from './toUsageErrors';
import { validateReading } from './validateReading';

/**
 * Validates and prepares `stopComponentUse` (rules 5 and 7 in `docs/store/components.md` §2.3) without writing.
 *
 * - `notFound` on `componentId` is returned alone.
 * - `componentId` is `notAllowed` when the component is not in use.
 * - `odometer` is `outOfRange` below the open period's start or above its bicycle's odometer.
 * - The period closes at the reading; a period of zero length is dropped.
 *
 * @param bicycles - The bicycle collection (read only).
 * @param components - The component collection.
 * @param componentId - The component to stop.
 * @param input - The reading.
 * @returns The changed component, or every failing field.
 * @example
 * planComponentStop(state.bicycle, state.components, chainA, { date: '2026-04-12', odometer: 1500 });
 */
export function planComponentStop(
  bicycles: BicycleCollection,
  components: ComponentCollection,
  componentId: ComponentId,
  input: ComponentStopInput,
): ComponentUsagePlan {
  if (!hasComponent(components, componentId)) {
    return { ok: false, errors: [{ field: 'componentId', code: 'notFound' }] };
  }

  const component = components.byId[componentId];
  const period = findOpenPeriod(component);
  const { reading, odometer: numberCode, date: dateCode } = validateReading(input);
  // Rule 1 keeps the period's bicycle stored; without it, the component cannot be stopped against an odometer.
  const bicycle = period && hasBicycle(bicycles, period.bicycleId) ? bicycles.byId[period.bicycleId] : undefined;
  const odometerCode =
    numberCode ??
    (period && bicycle && (reading.odometer < period.start.odometer || reading.odometer > bicycle.odometer)
      ? 'outOfRange'
      : null);
  const errors = toUsageErrors({
    componentId: period && bicycle ? null : 'notAllowed',
    odometer: odometerCode,
    date: dateCode,
  });

  if (!period || errors.length > 0) {
    return { ok: false, errors };
  }

  const usage =
    reading.odometer === period.start.odometer
      ? component.usage.filter(({ id }) => id !== period.id)
      : component.usage.map((other) => (other.id === period.id ? { ...other, end: reading } : other));
  const stopped = { ...component, usage };

  return { ok: true, component: stopped, changed: [stopped] };
}
