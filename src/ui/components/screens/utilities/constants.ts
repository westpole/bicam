import type { SxProps, Theme } from '@mui/material/styles';

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

/**
 * Submitted as a date when a date input holds a half-typed date. The browser reports such a date as `''`, which would be
 * saved as "unknown"; this value makes the store reject it as `invalidFormat` instead.
 */
export const INCOMPLETE_DATE = 'incomplete';

/** Latest date the picker accepts. Without it browsers allow six-digit years, which the store rejects. */
export const MAX_DATE = '9999-12-31';

/** Lets the browser draw the native date picker icon for the active color scheme. */
export const DATE_INPUT_SX: SxProps<Theme> = [
  { colorScheme: 'light' },
  (theme) => theme.applyStyles('dark', { colorScheme: 'dark' }),
];

/** A plain decimal number as typed: optional sign, digits, and at most one point. No exponent, no thousands separator. */
export const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;
