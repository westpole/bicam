import { type SubmitEvent, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import { BICYCLE_LIMITS } from '@store/bicycle/constants';
import { COMPONENT_TYPES } from '@store/components/constants';
import type { ComponentInput } from '@store/components/types';

import { NATIVE_SELECT_SLOT_PROPS } from '../utilities/constants';
import { getComponentErrorMessage } from '../utilities/getComponentErrorMessage';
import { DIALOG_FIELDS_SX, EMPTY_COMPONENT_VALUES, NEW_COMPONENT, NEW_COMPONENT_FIELDS } from './constants';
import type {
  IncludeComponentAlert,
  IncludeComponentDialogProps,
  NewComponentErrors,
  NewComponentField,
} from './types';
import { isBicycleFull } from './utilities/isBicycleFull';
import { toFormErrors } from './utilities/toFormErrors';

/**
 * Dialog that puts a component on the shown bicycle: a new one (type and model), or a spare one when there are any.
 * Each spare shows its type, model, label, and distance, so identical parts can be told apart. Whether it starts in use
 * is the caller's choice (when its type has room).
 * Mount it to open it and unmount it to close it, so every opening starts with an empty draft and a second submit
 * cannot land while it closes.
 *
 * The store owns all validation rules, and native validation is off so the translated messages show instead. After a
 * rejected save every invalid field shows its error and the first one gets focus. An error that belongs to no field
 * (for example a full bicycle) shows as an alert until the next edit, so a rejected save is never silent.
 *
 * @param props - See {@link IncludeComponentDialogProps}.
 * @returns The open dialog.
 * @example
 * {isOpen && <IncludeComponentDialog spareComponents={spares} onClose={close} {...handlers} />}
 */
export function IncludeComponentDialog({
  spareComponents,
  onCreateComponent,
  onIncludeComponent,
  onClose,
}: IncludeComponentDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [chosenId, setChosenId] = useState<string>(NEW_COMPONENT);
  const [values, setValues] = useState<ComponentInput>(EMPTY_COMPONENT_VALUES);
  const [errors, setErrors] = useState<NewComponentErrors>({});
  const [alert, setAlert] = useState<IncludeComponentAlert | null>(null);

  // A chosen component that is no longer spare falls back to a new one, so the submit always matches what is shown.
  const choice = spareComponents.some(({ component }) => component.id === chosenId) ? chosenId : NEW_COMPONENT;

  const handleChoiceChange = (value: string) => {
    setChosenId(value);
    setErrors({});
    setAlert(null);
  };

  const handleChange = (field: NewComponentField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setAlert(null);
  };

  const showAlert = (isFull: boolean) => setAlert((current) => ({ key: (current?.key ?? 0) + 1, isFull }));

  const submitSpare = () => {
    const result = onIncludeComponent(choice);

    if (result.ok) {
      onClose();
    } else {
      showAlert(isBicycleFull(result.errors));
    }
  };

  const submitNew = (elements: HTMLFormControlsCollection) => {
    const result = onCreateComponent(values);

    if (result.ok) {
      onClose();
      return;
    }

    const formErrors = toFormErrors(result.errors);
    const firstInvalid = NEW_COMPONENT_FIELDS.find((field) => formErrors[field]);

    setErrors(formErrors);

    if (firstInvalid) {
      setAlert(null);
      (elements.namedItem(firstInvalid) as HTMLElement).focus();
    } else {
      // The store reports an unknown or full bicycle alone, so there is never a field error next to it.
      showAlert(isBicycleFull(result.errors));
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (choice === NEW_COMPONENT) {
      submitNew(event.currentTarget.elements);
    } else {
      submitSpare();
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{t('screens.bicycleDetails.includeComponent.title')}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id={`${titleId}-form`}
          noValidate
          autoComplete="off"
          spacing={2}
          onSubmit={handleSubmit}
          sx={DIALOG_FIELDS_SX}
        >
          {spareComponents.length > 0 && (
            <TextField
              select
              name="component"
              label={t('screens.bicycleDetails.includeComponent.fields.component.label')}
              helperText={t('screens.bicycleDetails.includeComponent.fields.component.hint')}
              fullWidth
              value={choice}
              onChange={(event) => handleChoiceChange(event.target.value)}
              slotProps={NATIVE_SELECT_SLOT_PROPS}
            >
              <option value={NEW_COMPONENT}>{t('screens.bicycleDetails.includeComponent.newComponent')}</option>
              {spareComponents.map(({ component: { id, type, model, label }, distance }) => {
                const options = { type: t(`components.types.${type}`), model, label, distance };

                return (
                  <option key={id} value={id}>
                    {label === null
                      ? t('screens.bicycleDetails.includeComponent.spareComponent', options)
                      : t('screens.bicycleDetails.includeComponent.spareComponentWithLabel', options)}
                  </option>
                );
              })}
            </TextField>
          )}
          {choice === NEW_COMPONENT &&
            NEW_COMPONENT_FIELDS.map((field) => {
              const code = errors[field];
              const isType = field === 'type';

              return (
                <TextField
                  key={field}
                  select={isType}
                  name={field}
                  label={t(`screens.bicycleDetails.includeComponent.fields.${field}.label`)}
                  helperText={
                    code
                      ? getComponentErrorMessage(t, field, code)
                      : t(`screens.bicycleDetails.includeComponent.fields.${field}.hint`)
                  }
                  error={code !== undefined}
                  required
                  fullWidth
                  value={values[field]}
                  onChange={(event) => handleChange(field, event.target.value)}
                  slotProps={isType ? NATIVE_SELECT_SLOT_PROPS : undefined}
                >
                  {isType && <option value="">{t('screens.bicycleDetails.includeComponent.chooseType')}</option>}
                  {isType &&
                    COMPONENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t(`components.types.${type}`)}
                      </option>
                    ))}
                </TextField>
              );
            })}
          {alert && (
            <Alert key={alert.key} severity="error">
              {alert.isFull
                ? t('screens.bicycleDetails.includeComponent.errors.full', { max: BICYCLE_LIMITS.componentsMaxCount })
                : t('screens.bicycleDetails.includeComponent.errors.form')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>
          {t('screens.bicycleDetails.includeComponent.cancel')}
        </Button>
        <Button type="submit" form={`${titleId}-form`} variant="contained">
          {t('screens.bicycleDetails.includeComponent.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
