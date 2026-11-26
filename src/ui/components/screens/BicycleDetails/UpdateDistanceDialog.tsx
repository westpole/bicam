import { type SubmitEvent, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { DATE_INPUT_SX, INCOMPLETE_DATE, MAX_DATE } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import { parseNumber } from '../utilities/parseNumber';
import { DIALOG_FIELDS_SX, UPDATE_DISTANCE_FIELDS, UPDATE_DISTANCE_MODES } from './constants';
import type { UpdateDistanceDialogProps, UpdateDistanceErrors, UpdateDistanceMode } from './types';
import { addRide } from './utilities/addRide';
import { getDistanceErrorMessage } from './utilities/getDistanceErrorMessage';

/**
 * Dialog that records a new odometer reading for the shown bicycle: either the new total, or a ride that is added to the
 * current total and rounded to one decimal. The date defaults to today. Mount it to open it and unmount it to close
 * it, so every opening starts with a fresh draft and a second submit cannot land while it closes.
 *
 * The store owns all validation rules, and native validation is off so the translated messages show instead. After a
 * rejected save every invalid field shows its error and the first one gets focus; a total that is too low names the
 * lowest allowed reading. An error that belongs to no field shows as an alert until the next edit.
 *
 * @param props - See {@link UpdateDistanceDialogProps}.
 * @returns The open dialog.
 * @example
 * {isOpen && <UpdateDistanceDialog odometer={1500} minimumOdometer={0} onSetOdometer={save} onClose={close} />}
 */
export function UpdateDistanceDialog({ odometer, minimumOdometer, onSetOdometer, onClose }: UpdateDistanceDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const formId = `${titleId}-form`;
  const [mode, setMode] = useState<UpdateDistanceMode>('total');
  const [distance, setDistance] = useState('');
  const [date, setDate] = useState(() => getToday());
  const [errors, setErrors] = useState<UpdateDistanceErrors>({});
  // 0 hides the alert. Each rejected save that needs it raises the number, which is the alert's `key`, so the alert
  // remounts and screen readers announce it again.
  const [alertKey, setAlertKey] = useState(0);

  const handleModeChange = (value: string) => {
    setMode(value === 'ride' ? 'ride' : 'total');
    setErrors((current) => ({ ...current, distance: undefined }));
    setAlertKey(0);
  };

  const handleDistanceChange = (value: string) => {
    setDistance(value);
    setErrors((current) => ({ ...current, distance: undefined }));
    setAlertKey(0);
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setErrors((current) => ({ ...current, date: undefined }));
    setAlertKey(0);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const isDateIncomplete = (elements.namedItem('date') as HTMLInputElement).validity.badInput;
    // An empty field is not a number either; the store explains it.
    const amount = parseNumber(distance) ?? NaN;
    const result = onSetOdometer({
      odometer: mode === 'total' ? amount : addRide(odometer, amount),
      date: isDateIncomplete ? INCOMPLETE_DATE : date,
    });

    if (result.ok) {
      onClose();
      return;
    }

    const formErrors: UpdateDistanceErrors = {
      distance: result.errors.find(({ field }) => field === 'odometer')?.code,
      date: result.errors.find(({ field }) => field === 'odometerDate')?.code,
    };
    const hasOtherErrors = result.errors.some(({ field }) => field !== 'odometer' && field !== 'odometerDate');
    const firstInvalid = UPDATE_DISTANCE_FIELDS.find((field) => formErrors[field] !== undefined);

    setErrors(formErrors);
    setAlertKey((current) => (hasOtherErrors ? current + 1 : 0));

    if (firstInvalid) {
      (elements.namedItem(firstInvalid) as HTMLElement).focus();
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t('screens.bicycleDetails.updateDistance.title')}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id={formId}
          noValidate
          autoComplete="off"
          spacing={2}
          onSubmit={handleSubmit}
          sx={DIALOG_FIELDS_SX}
        >
          <FormControl>
            <FormLabel id={`${titleId}-mode`}>{t('screens.bicycleDetails.updateDistance.mode.label')}</FormLabel>
            <RadioGroup
              row
              name="mode"
              aria-labelledby={`${titleId}-mode`}
              value={mode}
              onChange={(event) => handleModeChange(event.target.value)}
            >
              {UPDATE_DISTANCE_MODES.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={t(`screens.bicycleDetails.updateDistance.mode.${option}`)}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <TextField
            name="distance"
            label={t(`screens.bicycleDetails.updateDistance.fields.${mode}.label`)}
            helperText={
              errors.distance
                ? getDistanceErrorMessage(t, 'distance', errors.distance, minimumOdometer, mode)
                : t(`screens.bicycleDetails.updateDistance.fields.${mode}.hint`, { total: odometer })
            }
            error={errors.distance !== undefined}
            required
            // The number is what the rider came to type, so it gets focus when the dialog opens.
            autoFocus
            fullWidth
            value={distance}
            onChange={(event) => handleDistanceChange(event.target.value)}
            slotProps={{
              // A decimal keyboard on phones; the text stays free, so the store can reject what is not a number.
              htmlInput: { inputMode: 'decimal' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">{t('screens.bicycleDetails.updateDistance.unit')}</InputAdornment>
                ),
              },
            }}
          />
          <TextField
            name="date"
            type="date"
            label={t('screens.bicycleDetails.updateDistance.fields.date.label')}
            helperText={
              errors.date
                ? getDistanceErrorMessage(t, 'date', errors.date, minimumOdometer, mode)
                : t('screens.bicycleDetails.updateDistance.fields.date.hint')
            }
            error={errors.date !== undefined}
            fullWidth
            value={date}
            onChange={(event) => handleDateChange(event.target.value)}
            // A date input always shows its format mask, so the label must not sit on top of it.
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: MAX_DATE, sx: DATE_INPUT_SX } }}
          />
          {alertKey > 0 && (
            <Alert key={alertKey} severity="error">
              {t('screens.bicycleDetails.updateDistance.errors.form')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>
          {t('screens.bicycleDetails.updateDistance.cancel')}
        </Button>
        <Button type="submit" form={formId} variant="contained">
          {t('screens.bicycleDetails.updateDistance.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
