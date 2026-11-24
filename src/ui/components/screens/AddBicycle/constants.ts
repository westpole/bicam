import type { SxProps, Theme } from '@mui/material/styles';

import { BICYCLE_LIMITS } from '@store/bicycle/constants';

import type { AddBicycleField, AddBicycleFieldDefinition, AddBicycleValues } from './types';

/** The form fields, top to bottom. Same order as the store's validation errors. */
export const ADD_BICYCLE_FIELDS: readonly AddBicycleFieldDefinition[] = [
  { field: 'name', required: true },
  { field: 'company', required: true },
  { field: 'model', required: true },
  { field: 'purchased', kind: 'date' },
  { field: 'size' },
  { field: 'frameGeometry', kind: 'multiline' },
];

/** Values of an untouched form. */
export const EMPTY_ADD_BICYCLE_VALUES: Readonly<AddBicycleValues> = {
  name: '',
  company: '',
  model: '',
  purchased: '',
  size: '',
  frameGeometry: '',
};

/** Maximum length per text field, shown in the "too long" message. */
export const FIELD_MAX_LENGTH: Readonly<Partial<Record<AddBicycleField, number>>> = {
  name: BICYCLE_LIMITS.nameMaxLength,
  company: BICYCLE_LIMITS.companyMaxLength,
  model: BICYCLE_LIMITS.modelMaxLength,
  size: BICYCLE_LIMITS.sizeMaxLength,
  frameGeometry: BICYCLE_LIMITS.frameGeometryMaxLength,
};

/**
 * Submitted as the purchase date when the date input holds a half-typed date. The browser reports such a date as `''`,
 * which would be saved as "unknown"; this value makes the store reject it as `invalidFormat` instead.
 */
export const INCOMPLETE_DATE = 'incomplete';

/** Latest date the picker accepts. Without it browsers allow six-digit years, which the store rejects. */
export const MAX_DATE = '9999-12-31';

/** Rows the multi-line field shows before it grows. */
export const MULTILINE_MIN_ROWS = 3;

/** Keeps the form readable on wide screens; on phones it fills the width. */
export const FORM_SX: SxProps<Theme> = { maxWidth: 'sm' };

/** Lets the browser draw the native date picker icon for the active color scheme. */
export const DATE_INPUT_SX: SxProps<Theme> = [
  { colorScheme: 'light' },
  (theme) => theme.applyStyles('dark', { colorScheme: 'dark' }),
];
