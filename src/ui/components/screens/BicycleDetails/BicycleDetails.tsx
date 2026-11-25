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
import { formatDate } from './utilities/formatDate';

/**
 * "Bicycle details" screen, opened from a bicycle card on the home screen: the bicycle's name, its fields, and the
 * list of its components, with a dialog that includes another one. Unknown fields read "Not specified".
 *
 * @param props - See {@link BicycleDetailsProps}.
 * @returns The details screen.
 * @example
 * <BicycleDetails
 *   bicycle={selectedBicycle}
 *   components={getInstalledComponents(components, selectedBicycle)}
 *   spareComponents={getSpareComponents(components, bicycles)}
 *   onCreateComponent={createComponent}
 *   onIncludeComponent={includeComponent}
 * />
 */
export function BicycleDetails({
  bicycle,
  components,
  spareComponents,
  onCreateComponent,
  onIncludeComponent,
}: BicycleDetailsProps) {
  const { t, i18n } = useTranslation();
  const componentsTitleId = useId();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} useFlexGap sx={SECTION_HEADER_SX}>
          <Typography id={componentsTitleId} variant="h6" component="h3">
            {t('screens.bicycleDetails.components.title')}
          </Typography>
          <Button variant="contained" onClick={() => setIsDialogOpen(true)}>
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
      {isDialogOpen && (
        <IncludeComponentDialog
          spareComponents={spareComponents}
          onCreateComponent={onCreateComponent}
          onIncludeComponent={onIncludeComponent}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </Stack>
  );
}
