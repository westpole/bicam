import { type SubmitEvent, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { COMPONENT_TYPES } from '@store/components/constants';
import type { ComponentLimits } from '@store/components/types';

import { NATIVE_SELECT_SLOT_PROPS } from '../utilities/constants';
import { getComponentErrorMessage } from '../utilities/getComponentErrorMessage';
import { DETAIL_FIELDS, EMPTY_ADD_COMPONENT_VALUES, FORM_SX, LIMIT_FIELDS } from './constants';
import type {
  AddComponentErrors,
  AddComponentFieldDefinition,
  AddComponentNotice,
  AddComponentProps,
  AddComponentValues,
} from './types';
import { applyTypeDefaults } from './utilities/applyTypeDefaults';
import { getSavedMessage } from './utilities/getSavedMessage';
import { hasChainLimits } from './utilities/hasChainLimits';
import { toComponentInput } from './utilities/toComponentInput';
import { toFormErrors } from './utilities/toFormErrors';

/**
 * "Add component" screen, opened from the app menu: a form that stores a spare component (on no bicycle) with its type,
 * model, label, starting distance, and limits. The draft is local state; the store owns all validation rules, and
 * native validation is off so the translated messages show instead.
 *
 * - Choosing a type fills the limits the rider has not edited with that type's suggestions. Chain-only limits show, and
 *   are submitted, only for a chain.
 * - After a rejected save every invalid field shows its error and the first one gets focus; editing a field clears its
 *   error. An error for a field the form does not show appears as an alert, so a rejected save is never silent.
 * - After a save the form clears, focus returns to the type, and a message names the stored component, so several
 *   identical parts can be added in a row.
 *
 * @param props - See {@link AddComponentProps}.
 * @returns The titled form.
 * @example
 * <AddComponent onSubmit={addComponent} onCancel={() => navigateTo('home')} />
 */
export function AddComponent({ onSubmit, onCancel }: AddComponentProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<AddComponentValues>(EMPTY_ADD_COMPONENT_VALUES);
  const [editedLimits, setEditedLimits] = useState<ReadonlySet<keyof ComponentLimits>>(() => new Set());
  const [errors, setErrors] = useState<AddComponentErrors>({});
  const [notice, setNotice] = useState<AddComponentNotice | null>(null);

  const isChain = hasChainLimits(values.type);
  const limitFields = LIMIT_FIELDS.filter(({ limit }) => limit === 'distance' || isChain);
  const shownFields = [...DETAIL_FIELDS, ...limitFields];

  const handleChange = (definition: AddComponentFieldDefinition, value: string) => {
    const { field, limit } = definition;

    if (field === 'type') {
      setValues((current) => applyTypeDefaults(current, value, editedLimits));
    } else {
      setValues((current) => ({ ...current, [field]: value }));
    }

    if (limit !== undefined) {
      setEditedLimits((current) => new Set(current).add(limit));
    }

    setErrors((current) => {
      const next: AddComponentErrors = { ...current, [field]: undefined };

      // A type change resets the limits the rider has not edited, so their old errors no longer apply.
      if (field === 'type') {
        for (const { field: limitField, limit: limitKey } of LIMIT_FIELDS) {
          if (limitKey !== undefined && !editedLimits.has(limitKey)) {
            next[limitField] = undefined;
          }
        }
      }

      return next;
    });
    setNotice(null);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const result = onSubmit(toComponentInput(values));
    const nextKey = (notice?.key ?? 0) + 1;

    if (result.ok) {
      setValues(EMPTY_ADD_COMPONENT_VALUES);
      setEditedLimits(new Set());
      setErrors({});
      setNotice({ key: nextKey, kind: 'saved', component: result.component });
      (elements.namedItem('type') as HTMLElement).focus();
      return;
    }

    const formErrors = toFormErrors(result.errors, shownFields);
    const firstInvalid = shownFields.find(({ field }) => formErrors[field]);

    setErrors(formErrors);
    setNotice(result.errors.length > Object.keys(formErrors).length ? { key: nextKey, kind: 'error' } : null);

    if (firstInvalid) {
      (elements.namedItem(firstInvalid.field) as HTMLElement).focus();
    }
  };

  const renderField = (definition: AddComponentFieldDefinition) => {
    const { field, key, kind, required, unit } = definition;
    const code = errors[field];
    const isSelect = kind === 'select';
    const isNumber = kind === 'number';

    return (
      <TextField
        key={field}
        select={isSelect}
        name={field}
        label={t(`screens.addComponent.fields.${key}.label`)}
        helperText={code ? getComponentErrorMessage(t, field, code) : t(`screens.addComponent.fields.${key}.hint`)}
        error={code !== undefined}
        required={required}
        fullWidth
        value={values[field]}
        onChange={(event) => handleChange(definition, event.target.value)}
        slotProps={
          isSelect
            ? NATIVE_SELECT_SLOT_PROPS
            : {
                // A decimal keyboard on phones; the text stays free, so the store can reject what is not a number.
                htmlInput: isNumber ? { inputMode: 'decimal' } : undefined,
                input: unit
                  ? {
                      endAdornment: (
                        <InputAdornment position="end">{t(`screens.addComponent.units.${unit}`)}</InputAdornment>
                      ),
                    }
                  : undefined,
              }
        }
      >
        {isSelect && <option value="">{t('screens.addComponent.chooseType')}</option>}
        {isSelect &&
          COMPONENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`components.types.${type}`)}
            </option>
          ))}
      </TextField>
    );
  };

  return (
    <Stack component="form" noValidate autoComplete="off" spacing={2} onSubmit={handleSubmit} sx={FORM_SX}>
      <Typography variant="h5" component="h2" sx={{ overflowWrap: 'anywhere' }}>
        {t('screens.addComponent.title')}
      </Typography>
      {DETAIL_FIELDS.map(renderField)}
      <Stack spacing={0.5}>
        <Typography variant="h6" component="h3">
          {t('screens.addComponent.limitsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('screens.addComponent.limitsHint')}
        </Typography>
      </Stack>
      {limitFields.map(renderField)}
      {notice?.kind === 'error' && (
        <Alert key={notice.key} severity="error">
          {t('screens.addComponent.errors.form')}
        </Alert>
      )}
      {notice?.kind === 'saved' && (
        <Alert key={notice.key} severity="success" role="status">
          {getSavedMessage(t, notice.component)}
        </Alert>
      )}
      <Stack direction="row" spacing={1}>
        <Button type="submit" variant="contained">
          {t('screens.addComponent.save')}
        </Button>
        <Button type="button" onClick={onCancel}>
          {t('screens.addComponent.cancel')}
        </Button>
      </Stack>
    </Stack>
  );
}
