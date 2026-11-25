import type { ComponentField } from '@store/components/types';

/** A valid value per number field, shown when the text typed there is not a number. Text fields have none. */
export const NUMBER_EXAMPLES: Readonly<Partial<Record<ComponentField, string>>> = {
  initialDistance: '412.5',
  'limits.distance': '4000',
  'limits.stretch': '0.75',
  'limits.lubrication': '300',
  'limits.cleaning': '1500',
};

/**
 * Makes a `TextField` a native `<select>`, which opens the system picker on phones. It always shows an option, so the
 * label must not sit on top of it.
 */
export const NATIVE_SELECT_SLOT_PROPS = { select: { native: true }, inputLabel: { shrink: true } } as const;
