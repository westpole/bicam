import type { SxProps, Theme } from '@mui/material/styles';

import type { ComponentInput } from '@store/components/types';

import type {
  BicycleDetailsField,
  NewComponentField,
  UpdateDistanceField,
  UpdateDistanceMode,
  UseComponentField,
} from './types';

/** The bicycle fields shown under the name, top to bottom. */
export const BICYCLE_DETAILS_FIELDS: readonly BicycleDetailsField[] = [
  'company',
  'model',
  'purchased',
  'size',
  'frameGeometry',
];

/** The ways to update the distance, in the order the dialog offers them. */
export const UPDATE_DISTANCE_MODES: readonly UpdateDistanceMode[] = ['total', 'ride'];

/** The update distance dialog's fields, top to bottom. The first invalid one gets focus after a rejected save. */
export const UPDATE_DISTANCE_FIELDS: readonly UpdateDistanceField[] = ['distance', 'date'];

/** The use component dialog's fields, top to bottom. The first invalid one gets focus after a rejected save. */
export const USE_COMPONENT_FIELDS: readonly UseComponentField[] = ['replaces', 'date', 'odometer'];

/** Value of the "New component" option. Component ids are never empty, so it cannot match one. */
export const NEW_COMPONENT = '';

/** The fields of the "new component" form, top to bottom. Same order as the store's validation errors. */
export const NEW_COMPONENT_FIELDS: readonly NewComponentField[] = ['type', 'model'];

/** Values of an untouched "new component" form. */
export const EMPTY_COMPONENT_VALUES: Readonly<ComponentInput> = { type: '', model: '' };

/** Keeps the screen readable on wide screens; on phones it fills the width. */
export const SCREEN_SX: SxProps<Theme> = { maxWidth: 'sm' };

/** The bicycle's name: a long one wraps instead of overflowing. */
export const NAME_SX: SxProps<Theme> = { overflowWrap: 'anywhere' };

/** The `<dl>` without the browser's margins. */
export const DETAILS_SX: SxProps<Theme> = { m: 0 };

/** A field's value (`<dd>`): keeps the line breaks of the frame geometry and wraps long text. */
export const VALUE_SX: SxProps<Theme> = { m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };

/** {@link VALUE_SX} for a field that is not filled in. */
export const UNKNOWN_VALUE_SX: SxProps<Theme> = { m: 0, color: 'text.secondary' };

/** The components title and its button; the button moves under the title when they do not fit on one row. */
export const SECTION_HEADER_SX: SxProps<Theme> = {
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
};

/** Form fields in the dialog. The top padding keeps the first field's floating label from being clipped. */
export const DIALOG_FIELDS_SX: SxProps<Theme> = { pt: 1 };
