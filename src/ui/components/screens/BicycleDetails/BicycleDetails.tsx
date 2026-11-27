import { useEffect, useId, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ACTIVE_LIMITS } from '@store/components/constants';
import type { ComponentId, ComponentStartInput } from '@store/components/types';
import { ComponentList } from '@ui/components/ComponentList/ComponentList';
import type { ComponentRow } from '@ui/components/ComponentList/types';
import { toRowId } from '@ui/components/ComponentList/utilities/toRowId';

import {
  BICYCLE_DETAILS_FIELDS,
  DETAILS_SX,
  NAME_SX,
  SCREEN_SX,
  SECTION_HEADER_SX,
  UNKNOWN_VALUE_SX,
  VALUE_SX,
} from './constants';
import { IncludeComponentDialog } from './IncludeComponentDialog';
import type { BicycleDetailsField, BicycleDetailsProps } from './types';
import { UpdateDistanceDialog } from './UpdateDistanceDialog';
import { UseComponentDialog } from './UseComponentDialog';
import { formatDate } from './utilities/formatDate';
import { getComponentName } from './utilities/getComponentName';
import { getTypesWithoutUse } from './utilities/getTypesWithoutUse';

/** The open dialog: a section's dialog, the use component dialog for one resting component, or none. */
type OpenDialog = 'distance' | 'include' | { use: ComponentId } | null;

/**
 * "Bicycle details" screen, opened from a bicycle card on the home screen: the bicycle's name, its fields, its
 * distance with a dialog that updates it, and its components with a dialog that includes another one. Components show
 * in two lists, **In use** and **Resting** (an empty one is hidden); a resting row has **Use now**, which opens a dialog
 * that starts it, as a swap when its type is full. A type with components but none in use shows a notice. After a
 * start, focus moves to the component's row. Unknown values read "Not specified".
 *
 * @param props - See {@link BicycleDetailsProps}.
 * @returns The details screen.
 * @example
 * <BicycleDetails
 *   bicycle={selectedBicycle}
 *   rows={installed.map((component) => ({ component, usage: getComponentUsage(component, bicycles.byId) }))}
 *   spareComponents={getSpareComponents(components, bicycles)}
 *   minimumOdometer={getMinimumOdometer(components, selectedBicycle.id)}
 *   onSetOdometer={setOdometer}
 *   onCreateComponent={createComponent}
 *   onIncludeComponent={includeComponent}
 *   onStartComponent={startComponent}
 *   getStartRange={getRange}
 * />
 */
export function BicycleDetails({
  bicycle,
  rows,
  spareComponents,
  minimumOdometer,
  onSetOdometer,
  onCreateComponent,
  onIncludeComponent,
  onStartComponent,
  getStartRange,
}: BicycleDetailsProps) {
  const { t, i18n } = useTranslation();
  const componentsTitleId = useId();
  const inUseTitleId = useId();
  const restingTitleId = useId();
  const distanceTitleId = useId();
  const rowsId = useId();
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  // The component whose row gets focus after the next commit: the one just put in use. A ref, because moving focus
  // changes nothing that is rendered.
  const focusIdRef = useRef<ComponentId | null>(null);
  const closeDialog = () => setOpenDialog(null);

  const inUse = rows.filter(({ usage }) => usage.isInUse);
  const resting = rows.filter(({ usage }) => !usage.isInUse);
  // Shown only while the chosen component still rests here, so a dialog never starts a component that changed.
  const chosenId = typeof openDialog === 'object' && openDialog !== null ? openDialog.use : null;
  const useRow = resting.find(({ component }) => component.id === chosenId);
  // What the chosen component can replace; the type is full when as many are in use as `ACTIVE_LIMITS` allows.
  const useCandidates = useRow ? inUse.filter(({ component }) => component.type === useRow.component.type) : [];
  const useLimit = useRow ? ACTIVE_LIMITS[useRow.component.type] : null;

  // Runs after every commit. Passive effects run after the closed dialog's cleanup, which returns focus to its (now
  // removed) button, so the row keeps focus. Relies on `onStartComponent` being synchronous: the ref is set, then the
  // store update and the dialog's close land in one commit, so the row exists when this runs.
  useEffect(() => {
    if (focusIdRef.current !== null) {
      document.getElementById(toRowId(rowsId, focusIdRef.current))?.focus();
      focusIdRef.current = null;
    }
  });

  /**
   * Reads one field as display text.
   *
   * @param field - The field to show.
   * @returns The value, or "Not specified" when it is unknown.
   */
  const getValue = (field: BicycleDetailsField): string => {
    const value = bicycle[field];

    if (value === null) {
      return t('screens.bicycleDetails.notSpecified');
    }

    return field === 'purchased' ? formatDate(value, i18n.language) : value;
  };

  /**
   * Starts a component and, on success, moves focus to its row.
   *
   * @param componentId - The component.
   * @param input - The dialog's input.
   * @returns The store's result.
   */
  const startComponent = (componentId: ComponentId, input: ComponentStartInput) => {
    const result = onStartComponent(componentId, input);

    if (result.ok) {
      focusIdRef.current = componentId;
    }

    return result;
  };

  /**
   * Renders the **Use now** button of a resting row. Its accessible name also names the component, so identical
   * buttons can be told apart.
   *
   * @param row - The resting row.
   * @returns The button.
   */
  const renderUseNow = ({ component }: ComponentRow) => (
    <Button
      variant="outlined"
      aria-label={t('screens.bicycleDetails.components.useNowLabel', { name: getComponentName(t, component) })}
      onClick={() => setOpenDialog({ use: component.id })}
    >
      {t('screens.bicycleDetails.components.useNow')}
    </Button>
  );

  return (
    <Stack spacing={3} sx={SCREEN_SX}>
      <Typography variant="h5" component="h2" sx={NAME_SX}>
        {bicycle.name}
      </Typography>
      <Stack component="dl" spacing={1.5} sx={DETAILS_SX}>
        {BICYCLE_DETAILS_FIELDS.map((field) => (
          <Box key={field}>
            <Typography variant="body2" component="dt" sx={{ color: 'text.secondary' }}>
              {t(`screens.addBicycle.fields.${field}.label`)}
            </Typography>
            <Typography variant="body1" component="dd" sx={bicycle[field] === null ? UNKNOWN_VALUE_SX : VALUE_SX}>
              {getValue(field)}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Stack spacing={1.5} component="section" aria-labelledby={distanceTitleId}>
        <Stack direction="row" spacing={1} useFlexGap sx={SECTION_HEADER_SX}>
          <Typography id={distanceTitleId} variant="h6" component="h3">
            {t('screens.bicycleDetails.distance.title')}
          </Typography>
          <Button variant="contained" onClick={() => setOpenDialog('distance')}>
            {t('screens.bicycleDetails.distance.update')}
          </Button>
        </Stack>
        <Stack component="dl" spacing={1.5} sx={DETAILS_SX}>
          <Box>
            <Typography variant="body2" component="dt" sx={{ color: 'text.secondary' }}>
              {t('screens.bicycleDetails.distance.odometer')}
            </Typography>
            <Typography variant="body1" component="dd" sx={VALUE_SX}>
              {t('screens.bicycleDetails.distance.value', { odometer: bicycle.odometer })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" component="dt" sx={{ color: 'text.secondary' }}>
              {t('screens.bicycleDetails.distance.date')}
            </Typography>
            <Typography variant="body1" component="dd" sx={bicycle.odometerDate === null ? UNKNOWN_VALUE_SX : VALUE_SX}>
              {bicycle.odometerDate === null
                ? t('screens.bicycleDetails.notSpecified')
                : formatDate(bicycle.odometerDate, i18n.language)}
            </Typography>
          </Box>
        </Stack>
      </Stack>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} useFlexGap sx={SECTION_HEADER_SX}>
          <Typography id={componentsTitleId} variant="h6" component="h3">
            {t('screens.bicycleDetails.components.title')}
          </Typography>
          <Button variant="contained" onClick={() => setOpenDialog('include')}>
            {t('screens.bicycleDetails.components.include')}
          </Button>
        </Stack>
        {getTypesWithoutUse(rows).map((type) => (
          <Alert key={type} severity="info">
            {t('screens.bicycleDetails.components.noneInUse', { type: t(`components.types.${type}`) })}
          </Alert>
        ))}
        {inUse.length > 0 && (
          <Stack spacing={1}>
            <Typography id={inUseTitleId} variant="subtitle1" component="h4">
              {t('screens.bicycleDetails.components.inUse')}
            </Typography>
            <ComponentList aria-labelledby={inUseTitleId} rows={inUse} rowIdPrefix={rowsId} />
          </Stack>
        )}
        {resting.length > 0 && (
          <Stack spacing={1}>
            <Typography id={restingTitleId} variant="subtitle1" component="h4">
              {t('screens.bicycleDetails.components.resting')}
            </Typography>
            <ComponentList
              aria-labelledby={restingTitleId}
              rows={resting}
              rowIdPrefix={rowsId}
              renderAction={renderUseNow}
            />
          </Stack>
        )}
        {rows.length === 0 && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('screens.bicycleDetails.components.empty')}
          </Typography>
        )}
      </Stack>
      {openDialog === 'distance' && (
        <UpdateDistanceDialog
          odometer={bicycle.odometer}
          minimumOdometer={minimumOdometer}
          onSetOdometer={onSetOdometer}
          onClose={closeDialog}
        />
      )}
      {openDialog === 'include' && (
        <IncludeComponentDialog
          spareComponents={spareComponents}
          onCreateComponent={onCreateComponent}
          onIncludeComponent={onIncludeComponent}
          onClose={closeDialog}
        />
      )}
      {useRow && (
        <UseComponentDialog
          row={useRow}
          candidates={useCandidates}
          needsReplace={useLimit !== null && useCandidates.length >= useLimit}
          odometer={bicycle.odometer}
          onStart={(input) => startComponent(useRow.component.id, input)}
          getStartRange={(replaces) => getStartRange(useRow.component.id, replaces)}
          onClose={closeDialog}
        />
      )}
    </Stack>
  );
}
