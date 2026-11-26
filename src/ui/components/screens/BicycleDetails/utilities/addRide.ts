/**
 * Adds a ride to the bicycle's current total, rounded to one decimal, because the store accepts readings with at most
 * one decimal and adding decimals in floating point can leave a tiny remainder (0.1 + 0.2 is 0.30000000000000004).
 *
 * @param total - The current odometer reading in kilometres.
 * @param ride - The ride in kilometres; `NaN` when the text was not a number.
 * @returns The new total, or `NaN` when `ride` is `NaN`, so the store rejects it.
 * @example
 * addRide(1500.1, 42.2); // 1542.3
 */
export function addRide(total: number, ride: number): number {
  return Math.round((total + ride) * 10) / 10;
}
