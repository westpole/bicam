import type { SxProps, Theme } from '@mui/material/styles';

import type { AddComponentFieldDefinition, AddComponentValues } from './types';

/** The fields above the limits, top to bottom. Same order as the store's validation errors. */
export const DETAIL_FIELDS: readonly AddComponentFieldDefinition[] = [
  { field: 'type', key: 'type', kind: 'select', required: true },
  { field: 'model', key: 'model', required: true },
  { field: 'label', key: 'label' },
  { field: 'initialDistance', key: 'initialDistance', kind: 'number', unit: 'km' },
];

/** The limit fields, top to bottom. Same order as the store's validation errors. */
export const LIMIT_FIELDS: readonly AddComponentFieldDefinition[] = [
  { field: 'limits.distance', key: 'limitDistance', kind: 'number', unit: 'km', limit: 'distance' },
  { field: 'limits.stretch', key: 'limitStretch', kind: 'number', unit: 'percent', limit: 'stretch' },
  { field: 'limits.lubrication', key: 'limitLubrication', kind: 'number', unit: 'km', limit: 'lubrication' },
  { field: 'limits.cleaning', key: 'limitCleaning', kind: 'number', unit: 'km', limit: 'cleaning' },
];

/** Values of an untouched form: no type chosen yet, so no limits are suggested. */
export const EMPTY_ADD_COMPONENT_VALUES: Readonly<AddComponentValues> = {
  type: '',
  model: '',
  label: '',
  initialDistance: '',
  'limits.distance': '',
  'limits.stretch': '',
  'limits.lubrication': '',
  'limits.cleaning': '',
};

/** A plain decimal number as typed: optional sign, digits, and at most one point. No exponent, no thousands separator. */
export const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/** Keeps the form readable on wide screens; on phones it fills the width. */
export const FORM_SX: SxProps<Theme> = { maxWidth: 'sm' };
