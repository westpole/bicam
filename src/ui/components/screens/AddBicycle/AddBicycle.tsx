import { type SubmitEvent, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import {
  ADD_BICYCLE_FIELDS,
  DATE_INPUT_SX,
  EMPTY_ADD_BICYCLE_VALUES,
  FORM_SX,
  INCOMPLETE_DATE,
  MAX_DATE,
  MULTILINE_MIN_ROWS,
} from './constants';
import type { AddBicycleErrors, AddBicycleField, AddBicycleProps, AddBicycleValues } from './types';
import { getErrorMessage } from './utilities/getErrorMessage';
import { hasOtherErrors } from './utilities/hasOtherErrors';
import { toFormErrors } from './utilities/toFormErrors';

/**
 * "Add bicycle" screen, opened from the app menu: a form for a new bicycle. The draft is local state; the store owns
 * all validation rules, and native validation is off so the translated messages show instead. After a rejected submit
 * every invalid field shows its error and the first one gets focus; editing a field clears its error.
 * Errors for fields the form does not have show as a general alert until the next edit, so a rejected save is never
 * silent.
 *
 * @param props - See {@link AddBicycleProps}.
 * @returns The titled form.
 * @example
 * <AddBicycle onSubmit={submitBicycle} onCancel={() => navigateTo('home')} />
 */
export function AddBicycle({ onSubmit, onCancel }: AddBicycleProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<AddBicycleValues>(EMPTY_ADD_BICYCLE_VALUES);
  const [errors, setErrors] = useState<AddBicycleErrors>({});
  // 0 hides the general alert. Each rejected save that needs it raises the number, which is the alert's `key`, so the
  // alert remounts and screen readers announce it again.
  const [alertKey, setAlertKey] = useState(0);

  const handleChange = (field: AddBicycleField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setAlertKey(0);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const isDateIncomplete = (elements.namedItem('purchased') as HTMLInputElement).validity.badInput;
    const result = onSubmit({ ...values, purchased: isDateIncomplete ? INCOMPLETE_DATE : values.purchased });

    if (result.ok) {
      return;
    }

    const formErrors = toFormErrors(result.errors);
    const firstInvalid = ADD_BICYCLE_FIELDS.find(({ field }) => formErrors[field]);

    setErrors(formErrors);
    setAlertKey((current) => (hasOtherErrors(result.errors) ? current + 1 : 0));

    if (firstInvalid) {
      (elements.namedItem(firstInvalid.field) as HTMLElement).focus();
    }
  };

  return (
    <Stack component="form" noValidate autoComplete="off" spacing={2} onSubmit={handleSubmit} sx={FORM_SX}>
      <Typography variant="h5" component="h2" sx={{ overflowWrap: 'anywhere' }}>
        {t('screens.addBicycle.title')}
      </Typography>
      {ADD_BICYCLE_FIELDS.map(({ field, required, kind }) => {
        const code = errors[field];
        const isDate = kind === 'date';
        const isMultiline = kind === 'multiline';

        return (
          <TextField
            key={field}
            name={field}
            label={t(`screens.addBicycle.fields.${field}.label`)}
            helperText={code ? getErrorMessage(t, field, code) : t(`screens.addBicycle.fields.${field}.hint`)}
            error={code !== undefined}
            required={required}
            type={isDate ? 'date' : 'text'}
            multiline={isMultiline}
            minRows={isMultiline ? MULTILINE_MIN_ROWS : undefined}
            fullWidth
            value={values[field]}
            onChange={(event) => handleChange(field, event.target.value)}
            slotProps={
              // A date input always shows its format mask, so the label must not sit on top of it.
              isDate ? { inputLabel: { shrink: true }, htmlInput: { max: MAX_DATE, sx: DATE_INPUT_SX } } : undefined
            }
          />
        );
      })}
      {alertKey > 0 && (
        <Alert key={alertKey} severity="error">
          {t('screens.addBicycle.errors.form')}
        </Alert>
      )}
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained">
          {t('screens.addBicycle.save')}
        </Button>
        <Button type="button" onClick={onCancel}>
          {t('screens.addBicycle.cancel')}
        </Button>
      </Stack>
    </Stack>
  );
}
