import { type SubmitEvent, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
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

import { LUBRICANTS } from '@store/components/constants';
import type { ComponentHistoryField, ComponentHistoryInput } from '@store/components/types';

import { DATE_INPUT_SX, INCOMPLETE_DATE, MAX_DATE, NATIVE_SELECT_SLOT_PROPS } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import { parseNumber } from '../utilities/parseNumber';
import { CARE_ACTIONS, DIALOG_FIELDS_SX, LOG_CARE_FIELDS } from './constants';
import type { CareAction, LogCareDialogProps, LogCareErrors, LogCareField } from './types';
import { getCareErrorMessage } from './utilities/getCareErrorMessage';
import { getComponentName } from './utilities/getComponentName';
import { getDistanceAtReading } from './utilities/getDistanceAtReading';
import { getInstalledDate } from './utilities/getInstalledDate';
import { getReadingRange } from './utilities/getReadingRange';

/**
 * Store fields that the dialog copies from the date. When the date is invalid their errors repeat the date's, so they
 * are not shown again as an alert.
 */
const DATE_DERIVED_FIELDS: readonly ComponentHistoryField[] = ['installed', 'lubricated', 'cleaned'];

/**
 * Dialog that logs care on a chain: what was done (topped up, cleaned and relubricated, or measured only), the oil or
 * wax (preset to the last one), the date (today by default), and the chain's own distance at that moment. For a chain in
 * use it also asks for the odometer (the current one by default) and fills in the distance of that reading, so care
 * entered late counts from the right distance; a resting chain gets its current distance. The distance stays
 * editable. A top-up with another lubricant than the last one shows a warning but can be saved. Mount it to open it and
 * unmount it to close it, so every opening starts with a fresh draft.
 *
 * The dialog checks what the store cannot know: a measurement needs a stretch, a lubrication needs a lubricant, and the
 * odometer reading must lie between the chain's installation and the bicycle's odometer. The store checks the rest.
 * After a rejected save every invalid field shows its error and the first one gets focus. An error that belongs to no
 * field shows as an alert until the next edit.
 *
 * @param props - See {@link LogCareDialogProps}.
 * @returns The open dialog.
 * @example
 * {row && <LogCareDialog row={row} odometer={4500} onLogCare={logCare} onClose={close} />}
 */
export function LogCareDialog({ row, odometer, onLogCare, onClose }: LogCareDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const formId = `${titleId}-form`;
  const { component, usage } = row;
  // The readings an entry can be dated at; `null` for a resting chain, which has no odometer field.
  const readings = getReadingRange(usage, odometer);
  const isInUse = readings !== null;
  const lastLubricant = usage.lubricant;
  const [action, setAction] = useState<CareAction>(CARE_ACTIONS[0]);
  const [lubricant, setLubricant] = useState<string>(() => lastLubricant ?? '');
  const [date, setDate] = useState(() => getToday());
  const [reading, setReading] = useState(() => String(odometer));
  const [distance, setDistance] = useState(() => {
    const atOdometer = getDistanceAtReading(usage, odometer, odometer);

    return atOdometer.ok ? String(atOdometer.distance) : '';
  });
  const [stretch, setStretch] = useState('');
  const [errors, setErrors] = useState<LogCareErrors>({});
  // 0 hides the alert. Each rejected save that needs it raises the number, which is the alert's `key`, so the alert
  // remounts and screen readers announce it again.
  const [alertKey, setAlertKey] = useState(0);
  const isLubricating = action !== 'measured';
  // A top-up on top of the other lubricant mixes the two; a clean removes the old one first.
  const isSwitchingLubricant = action === 'toppedUp' && lubricant !== '' && lubricant !== lastLubricant;

  /**
   * Clears the errors an edit can fix.
   *
   * @param fields - The edited fields.
   */
  const clearErrors = (...fields: LogCareField[]) => {
    setErrors((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [field, undefined])) }));
    setAlertKey(0);
  };

  const handleChange = (field: Exclude<LogCareField, 'odometer'>, value: string) => {
    const setters = { lubricant: setLubricant, date: setDate, distance: setDistance, stretch: setStretch };

    setters[field](value);
    clearErrors(field);
  };

  // A usable reading fills in the distance of that moment; anything else leaves the distance as it is.
  const handleReadingChange = (value: string) => {
    const parsed = parseNumber(value);
    const atReading = parsed === null || Number.isNaN(parsed) ? null : getDistanceAtReading(usage, odometer, parsed);

    setReading(value);
    clearErrors('odometer');

    if (atReading?.ok) {
      setDistance(String(atReading.distance));
      clearErrors('odometer', 'distance');
    }
  };

  const handleActionChange = (value: CareAction) => {
    setAction(value);
    // What is required changes with the action.
    clearErrors('lubricant', 'stretch');
  };

  /**
   * Checks what the store cannot know about the draft.
   *
   * @param stretchValue - The parsed stretch.
   * @returns The dialog's own errors.
   */
  const checkDraft = (stretchValue: number | null): LogCareErrors => {
    const draftErrors: LogCareErrors = {};
    const parsedReading = isInUse ? parseNumber(reading) : null;

    if (isLubricating && lubricant === '') {
      draftErrors.lubricant = 'required';
    }

    // An empty reading is allowed: the rider then enters the distance directly.
    if (parsedReading !== null) {
      const atReading = Number.isNaN(parsedReading) ? null : getDistanceAtReading(usage, odometer, parsedReading);

      if (atReading === null) {
        draftErrors.odometer = 'invalidFormat';
      } else if (!atReading.ok) {
        draftErrors.odometer = atReading.code;
      }
    }

    if (action === 'measured' && stretchValue === null) {
      draftErrors.stretch = 'required';
    }

    return draftErrors;
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const isDateIncomplete = (elements.namedItem('date') as HTMLInputElement).validity.badInput;
    // The date goes to the store as typed: an empty field as '' (`required`), a half-typed one as `INCOMPLETE_DATE`
    // (`invalidFormat`). `lubricated`, `cleaned`, and, for a chain without a known start date, `installed` copy it,
    // so the store reports those fields too; the errors are shown once, on the date (`DATE_DERIVED_FIELDS`).
    const entryDate = isDateIncomplete ? INCOMPLETE_DATE : date;
    const stretchValue = parseNumber(stretch);
    let formErrors = checkDraft(stretchValue);
    let hasOtherErrors = false;

    if (Object.keys(formErrors).length === 0) {
      const input: ComponentHistoryInput = {
        date: entryDate,
        installed: getInstalledDate(component, entryDate),
        // Text that is not a number is not empty either; the store explains it.
        distance: parseNumber(distance),
        stretch: stretchValue,
        lubricated: isLubricating ? entryDate : null,
        lubricant: isLubricating ? lubricant : null,
        cleaned: action === 'cleaned' ? entryDate : null,
      };
      const result = onLogCare(input);

      if (result.ok) {
        onClose();
        return;
      }

      formErrors = Object.fromEntries(
        LOG_CARE_FIELDS.flatMap((field) => {
          const error = result.errors.find((candidate) => candidate.field === field);

          return error ? [[field, error.code]] : [];
        }),
      );
      hasOtherErrors = result.errors.some(
        ({ field }) =>
          !(LOG_CARE_FIELDS as readonly string[]).includes(field) &&
          !(DATE_DERIVED_FIELDS.includes(field) && formErrors.date !== undefined),
      );
    }

    const firstInvalid = LOG_CARE_FIELDS.find((field) => formErrors[field] !== undefined);

    setErrors(formErrors);
    setAlertKey((current) => (hasOtherErrors ? current + 1 : 0));

    if (firstInvalid) {
      (elements.namedItem(firstInvalid) as HTMLElement).focus();
    }
  };

  /**
   * Picks the text under a field: its error, or its hint.
   *
   * @param field - The field.
   * @param hint - The hint's key under `screens.bicycleDetails.logCare.fields`.
   * @returns The helper text.
   */
  const getHelperText = (
    field: LogCareField,
    hint: 'lubricant' | 'date' | 'odometer' | 'distance' | 'stretchOptional' | 'stretchRequired',
  ) => {
    const code = errors[field];

    return code === undefined
      ? t(`screens.bicycleDetails.logCare.fields.${hint}.hint`)
      : getCareErrorMessage(t, field, code, readings);
  };

  /**
   * Builds the slot props of a number field: a decimal keyboard on phones and a unit after the value. The text stays
   * free, so a wrong value can be explained.
   *
   * @param unit - The unit's translation key.
   * @returns The slot props.
   */
  const numberSlotProps = (unit: 'km' | 'percent') => ({
    htmlInput: { inputMode: 'decimal' as const },
    input: {
      endAdornment: <InputAdornment position="end">{t(`screens.bicycleDetails.logCare.units.${unit}`)}</InputAdornment>,
    },
  });

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-component`}
    >
      <DialogTitle id={titleId}>{t('screens.bicycleDetails.logCare.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${titleId}-component`} sx={{ overflowWrap: 'anywhere' }}>
          {t('screens.bicycleDetails.logCare.component', {
            name: getComponentName(t, component),
            distance: usage.distance,
          })}
        </DialogContentText>
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
            <FormLabel id={`${titleId}-action`}>{t('screens.bicycleDetails.logCare.action.label')}</FormLabel>
            <RadioGroup
              name="action"
              aria-labelledby={`${titleId}-action`}
              value={action}
              onChange={(event) => handleActionChange(event.target.value as CareAction)}
            >
              {CARE_ACTIONS.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  // The default option, checked when the dialog opens, takes focus first.
                  control={<Radio autoFocus={option === CARE_ACTIONS[0]} />}
                  label={t(`screens.bicycleDetails.logCare.action.${option}`)}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {isLubricating && (
            <TextField
              select
              name="lubricant"
              label={t('screens.bicycleDetails.logCare.fields.lubricant.label')}
              helperText={getHelperText('lubricant', 'lubricant')}
              error={errors.lubricant !== undefined}
              required
              fullWidth
              value={lubricant}
              onChange={(event) => handleChange('lubricant', event.target.value)}
              slotProps={NATIVE_SELECT_SLOT_PROPS}
            >
              {lastLubricant === null && (
                <option value="">{t('screens.bicycleDetails.logCare.chooseLubricant')}</option>
              )}
              {LUBRICANTS.map((option) => (
                <option key={option} value={option}>
                  {t(`components.lubricants.${option}`)}
                </option>
              ))}
            </TextField>
          )}
          {isSwitchingLubricant && lastLubricant !== null && (
            <Alert severity="warning">
              {t('screens.bicycleDetails.logCare.switchWarning', {
                last: t(`components.lubricants.${lastLubricant}`),
              })}
            </Alert>
          )}
          <TextField
            name="date"
            type="date"
            label={t('screens.bicycleDetails.logCare.fields.date.label')}
            helperText={getHelperText('date', 'date')}
            error={errors.date !== undefined}
            required
            fullWidth
            value={date}
            onChange={(event) => handleChange('date', event.target.value)}
            // A date input always shows its format mask, so the label must not sit on top of it.
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: MAX_DATE, sx: DATE_INPUT_SX } }}
          />
          {isInUse && (
            <TextField
              name="odometer"
              label={t('screens.bicycleDetails.logCare.fields.odometer.label')}
              helperText={getHelperText('odometer', 'odometer')}
              error={errors.odometer !== undefined}
              fullWidth
              value={reading}
              onChange={(event) => handleReadingChange(event.target.value)}
              slotProps={numberSlotProps('km')}
            />
          )}
          <TextField
            name="distance"
            label={t('screens.bicycleDetails.logCare.fields.distance.label')}
            helperText={getHelperText('distance', 'distance')}
            error={errors.distance !== undefined}
            fullWidth
            value={distance}
            onChange={(event) => handleChange('distance', event.target.value)}
            slotProps={numberSlotProps('km')}
          />
          <TextField
            name="stretch"
            label={t('screens.bicycleDetails.logCare.fields.stretch.label')}
            helperText={getHelperText('stretch', action === 'measured' ? 'stretchRequired' : 'stretchOptional')}
            error={errors.stretch !== undefined}
            required={action === 'measured'}
            fullWidth
            value={stretch}
            onChange={(event) => handleChange('stretch', event.target.value)}
            slotProps={numberSlotProps('percent')}
          />
          {alertKey > 0 && (
            <Alert key={alertKey} severity="error">
              {t('screens.bicycleDetails.logCare.errors.form')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>
          {t('screens.bicycleDetails.logCare.cancel')}
        </Button>
        <Button type="submit" form={formId} variant="contained">
          {t('screens.bicycleDetails.logCare.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
