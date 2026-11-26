import { useId, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ComponentList } from '@ui/components/ComponentList/ComponentList';

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
import { formatDate } from './utilities/formatDate';

/**
 * "Bicycle details" screen, opened from a bicycle card on the home screen: the bicycle's name, its fields, its
 * distance with a dialog that updates it, and the list of its components with a dialog that includes another one.
 * Unknown values read "Not specified".
 *
 * @param props - See {@link BicycleDetailsProps}.
 * @returns The details screen.
 * @example
 * <BicycleDetails
 *   bicycle={selectedBicycle}
 *   components={getInstalledComponents(components, selectedBicycle)}
 *   spareComponents={getSpareComponents(components, bicycles)}
 *   minimumOdometer={getMinimumOdometer(components, selectedBicycle.id)}
 *   onSetOdometer={setOdometer}
 *   onCreateComponent={createComponent}
 *   onIncludeComponent={includeComponent}
 * />
 */
export function BicycleDetails({
  bicycle,
  components,
  spareComponents,
  minimumOdometer,
  onSetOdometer,
  onCreateComponent,
  onIncludeComponent,
}: BicycleDetailsProps) {
  const { t, i18n } = useTranslation();
  const componentsTitleId = useId();
  const distanceTitleId = useId();
  const [openDialog, setOpenDialog] = useState<'distance' | 'include' | null>(null);
  const closeDialog = () => setOpenDialog(null);

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
        {components.length > 0 ? (
          <ComponentList aria-labelledby={componentsTitleId} components={components} />
        ) : (
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
    </Stack>
  );
}
