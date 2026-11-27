import { type SubmitEvent, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import type { StartRange } from '@store/components/types';

import { DATE_INPUT_SX, INCOMPLETE_DATE, MAX_DATE, NATIVE_SELECT_SLOT_PROPS } from '../utilities/constants';
import { getToday } from '../utilities/getToday';
import { parseNumber } from '../utilities/parseNumber';
import { DIALOG_FIELDS_SX, USE_COMPONENT_FIELDS } from './constants';
import type { UseComponentDialogProps, UseComponentErrors, UseComponentField } from './types';
import { getComponentName } from './utilities/getComponentName';
import { getUseErrorMessage } from './utilities/getUseErrorMessage';

/**
 * Dialog that puts a resting component in use on the shown bicycle: the date (today by default), the odometer at that
 * moment (the current one by default), and, when its type is full, the component it replaces (preselected when only one
 * is in use). A lower odometer enters a swap late; the store splits the distance there. Mount it to open it and unmount
 * it to close it, so every opening starts with a fresh draft and a second submit cannot land while it closes.
 *
 * The store owns all validation rules, and native validation is off so the translated messages show instead. After a
 * rejected save every invalid field shows its error and the first one gets focus; a rejected reading names the
 * readings the store accepts. An error that belongs to no field shows as an alert until the next edit.
 *
 * @param props - See {@link UseComponentDialogProps}.
 * @returns The open dialog.
 * @example
 * {row && <UseComponentDialog row={row} candidates={inUse} needsReplace odometer={4500} {...handlers} />}
 */
export function UseComponentDialog({
  row,
  candidates,
  needsReplace,
  odometer,
  onStart,
  getStartRange,
  onClose,
}: UseComponentDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const formId = `${titleId}-form`;
  // With one component to replace there is nothing to choose, so it is preselected and has no empty option.
  const isPreselected = candidates.length === 1;
  const [replaces, setReplaces] = useState(() => (needsReplace && isPreselected ? candidates[0].component.id : ''));
  const [date, setDate] = useState(() => getToday());
  const [reading, setReading] = useState(() => String(odometer));
  const [errors, setErrors] = useState<UseComponentErrors>({});
  const [range, setRange] = useState<StartRange | null>(null);
  // 0 hides the alert. Each rejected save that needs it raises the number, which is the alert's `key`, so the alert
  // remounts and screen readers announce it again.
  const [alertKey, setAlertKey] = useState(0);

  const handleChange = (field: UseComponentField, value: string) => {
    const setters = { replaces: setReplaces, date: setDate, odometer: setReading };

    setters[field](value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    // The range belongs to the rejected save; any edit can change it.
    setRange(null);
    setAlertKey(0);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const isDateIncomplete = (elements.namedItem('date') as HTMLInputElement).validity.badInput;
    const replacesId = needsReplace && replaces !== '' ? replaces : null;
    const result = onStart({
      date: isDateIncomplete ? INCOMPLETE_DATE : date,
      // An empty field is not a number either; the store explains it.
      odometer: parseNumber(reading) ?? NaN,
      replaces: replacesId,
    });

    if (result.ok) {
      onClose();
      return;
    }

    const shown = USE_COMPONENT_FIELDS.filter((field) => field !== 'replaces' || needsReplace);
    const formErrors: UseComponentErrors = Object.fromEntries(
      shown.flatMap((field) => {
        const error = result.errors.find((candidate) => candidate.field === field);

        return error ? [[field, error.code]] : [];
      }),
    );
    const hasOtherErrors = result.errors.some(({ field }) => !(shown as readonly string[]).includes(field));
    const firstInvalid = shown.find((field) => formErrors[field] !== undefined);

    setErrors(formErrors);
    setRange(formErrors.odometer === 'outOfRange' ? getStartRange(replacesId) : null);
    setAlertKey((current) => (hasOtherErrors ? current + 1 : 0));

    if (firstInvalid) {
      (elements.namedItem(firstInvalid) as HTMLElement).focus();
    }
  };

  /**
   * Picks the text under a field: its error, or its hint.
   *
   * @param field - The field.
   * @returns The helper text.
   */
  const getHelperText = (field: UseComponentField) => {
    const code = errors[field];

    return code === undefined
      ? t(`screens.bicycleDetails.useComponent.fields.${field}.hint`)
      : getUseErrorMessage(t, field, code, range);
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={titleId}
      aria-describedby={`${titleId}-component`}
    >
      <DialogTitle id={titleId}>{t('screens.bicycleDetails.useComponent.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText id={`${titleId}-component`} sx={{ overflowWrap: 'anywhere' }}>
          {t('screens.bicycleDetails.useComponent.component', {
            name: getComponentName(t, row.component),
            distance: row.usage.distance,
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
          {needsReplace && (
            <TextField
              select
              name="replaces"
              label={t('screens.bicycleDetails.useComponent.fields.replaces.label')}
              helperText={getHelperText('replaces')}
              error={errors.replaces !== undefined}
              required
              // Nothing is preselected, so the choice comes first.
              autoFocus={!isPreselected}
              fullWidth
              value={replaces}
              onChange={(event) => handleChange('replaces', event.target.value)}
              slotProps={NATIVE_SELECT_SLOT_PROPS}
            >
              {!isPreselected && (
                <option value="">{t('screens.bicycleDetails.useComponent.chooseReplaced')}</option>
              )}
              {candidates.map(({ component: { id, model, label }, usage: { distance } }) => (
                <option key={id} value={id}>
                  {label === null
                    ? t('screens.bicycleDetails.useComponent.replacedComponent', { model, distance })
                    : t('screens.bicycleDetails.useComponent.replacedComponentWithLabel', { model, label, distance })}
                </option>
              ))}
            </TextField>
          )}
          <TextField
            name="date"
            type="date"
            label={t('screens.bicycleDetails.useComponent.fields.date.label')}
            helperText={getHelperText('date')}
            error={errors.date !== undefined}
            fullWidth
            value={date}
            onChange={(event) => handleChange('date', event.target.value)}
            // A date input always shows its format mask, so the label must not sit on top of it.
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: MAX_DATE, sx: DATE_INPUT_SX } }}
          />
          <TextField
            name="odometer"
            label={t('screens.bicycleDetails.useComponent.fields.odometer.label')}
            helperText={getHelperText('odometer')}
            error={errors.odometer !== undefined}
            required
            // The reading is what changes for a swap entered late.
            autoFocus={!needsReplace || isPreselected}
            fullWidth
            value={reading}
            onChange={(event) => handleChange('odometer', event.target.value)}
            slotProps={{
              // A decimal keyboard on phones; the text stays free, so the store can reject what is not a number.
              htmlInput: { inputMode: 'decimal' },
              input: {
                endAdornment: (
                  <InputAdornment position="end">{t('screens.bicycleDetails.useComponent.unit')}</InputAdornment>
                ),
              },
            }}
          />
          {alertKey > 0 && (
            <Alert key={alertKey} severity="error">
              {t('screens.bicycleDetails.useComponent.errors.form')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>
          {t('screens.bicycleDetails.useComponent.cancel')}
        </Button>
        <Button type="submit" form={formId} variant="contained">
          {t('screens.bicycleDetails.useComponent.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
