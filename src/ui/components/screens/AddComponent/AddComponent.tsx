import { type SubmitEvent, useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { COMPONENT_TYPES } from '@store/components/constants';
import type { ComponentErrorCode, ComponentLimits } from '@store/components/types';

import { NATIVE_SELECT_SLOT_PROPS } from '../utilities/constants';
import { getComponentErrorMessage } from '../utilities/getComponentErrorMessage';
import { getCurrentUse } from '../utilities/getCurrentUse';
import { DETAIL_FIELDS, EMPTY_ADD_COMPONENT_VALUES, EMPTY_PLACEMENT, FORM_SX, LIMIT_FIELDS } from './constants';
import type {
  AddComponentErrors,
  AddComponentFieldDefinition,
  AddComponentNotice,
  AddComponentPlacement,
  AddComponentPlacementDraft,
  AddComponentProps,
  AddComponentValues,
} from './types';
import { applyTypeDefaults } from './utilities/applyTypeDefaults';
import { getSavedMessage } from './utilities/getSavedMessage';
import { hasChainLimits } from './utilities/hasChainLimits';
import { resolvePlacement } from './utilities/resolvePlacement';
import { toComponentInput } from './utilities/toComponentInput';
import { toFormErrors } from './utilities/toFormErrors';

/**
 * "Add component" screen, opened from the app menu: a form that stores a component with its type, model, label,
 * starting distance, and limits, either as a spare or on a bicycle. The draft is local state; the store owns all
 * validation rules, and native validation is off so the translated messages show instead.
 *
 * - Choosing a type fills the limits the rider has not edited with that type's suggestions. Chain-only limits show, and
 *   are submitted, only for a chain.
 * - With bicycles, a "Bicycle" select ("None" by default) and, once one is chosen, "In use now". It starts on when the
 *   type has room there, and the rider can change it; choosing another type or bicycle restores the default. When it
 *   is on and the type is full, the form asks which component to replace, preselected when there is one. Use starts
 *   today, at the bicycle's odometer.
 * - After a rejected save every invalid field shows its error and the first one gets focus; editing a field clears its
 *   error. An error for a field the form does not show appears as an alert, so a rejected save is never silent.
 * - After a save the form clears, focus returns to the type, and a message names the stored component, so several
 *   identical parts can be added in a row. A save with a bicycle normally leaves the screen (the caller opens it).
 *
 * @param props - See {@link AddComponentProps}.
 * @returns The titled form.
 * @example
 * <AddComponent bicycles={bicycles} onSubmit={submitComponent} onCancel={() => navigateTo('home')} />
 */
export function AddComponent({ bicycles, onSubmit, onCancel }: AddComponentProps) {
  const { t } = useTranslation();
  const inUseHintId = useId();
  const [values, setValues] = useState<AddComponentValues>(EMPTY_ADD_COMPONENT_VALUES);
  const [editedLimits, setEditedLimits] = useState<ReadonlySet<keyof ComponentLimits>>(() => new Set());
  const [errors, setErrors] = useState<AddComponentErrors>({});
  const [draft, setDraft] = useState<AddComponentPlacementDraft>(EMPTY_PLACEMENT);
  const [replacesError, setReplacesError] = useState<ComponentErrorCode | null>(null);
  const [notice, setNotice] = useState<AddComponentNotice | null>(null);

  const isChain = hasChainLimits(values.type);
  const limitFields = LIMIT_FIELDS.filter(({ limit }) => limit === 'distance' || isChain);
  const shownFields = [...DETAIL_FIELDS, ...limitFields];
  const placement = resolvePlacement(bicycles, values.type, draft);

  // Another type or bicycle restores the "In use now" default and drops the replaced component.
  const changeDraft = (changes: Partial<AddComponentPlacementDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setReplacesError(null);
    setNotice(null);
  };

  const handleChange = (definition: AddComponentFieldDefinition, value: string) => {
    const { field, limit } = definition;

    if (field === 'type') {
      setValues((current) => applyTypeDefaults(current, value, editedLimits));
      changeDraft({ inUse: null, replaces: '' });
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

  const getPlacement = (): AddComponentPlacement | null => {
    const { chosen, inUse, replaces } = placement;

    if (!chosen) {
      return null;
    }

    const bicycleId = chosen.bicycle.id;

    return inUse ? { bicycleId, use: getCurrentUse(chosen.bicycle, replaces || null) } : { bicycleId };
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { elements } = event.currentTarget;
    const result = onSubmit(toComponentInput(values), getPlacement());
    const nextKey = (notice?.key ?? 0) + 1;

    if (result.ok) {
      setValues(EMPTY_ADD_COMPONENT_VALUES);
      setEditedLimits(new Set());
      setErrors({});
      setDraft(EMPTY_PLACEMENT);
      setReplacesError(null);
      setNotice({ key: nextKey, kind: 'saved', component: result.component });
      (elements.namedItem('type') as HTMLElement).focus();
      return;
    }

    const formErrors = toFormErrors(result.errors, shownFields);
    const firstInvalid = shownFields.find(({ field }) => formErrors[field]);
    const replacesCode = placement.needsReplace
      ? (result.errors.find(({ field }) => field === 'replaces')?.code ?? null)
      : null;
    const shownCount = Object.keys(formErrors).length + (replacesCode === null ? 0 : 1);

    setErrors(formErrors);
    setReplacesError(replacesCode);
    setNotice(result.errors.length > shownCount ? { key: nextKey, kind: 'error' } : null);

    if (firstInvalid) {
      (elements.namedItem(firstInvalid.field) as HTMLElement).focus();
    } else if (replacesCode !== null) {
      (elements.namedItem('replaces') as HTMLElement).focus();
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

  const renderPlacement = () => {
    const { chosen, inUse, candidates, needsReplace, replaces } = placement;

    return (
      <>
        <TextField
          select
          name="bicycleId"
          label={t('screens.addComponent.fields.bicycle.label')}
          helperText={t('screens.addComponent.fields.bicycle.hint')}
          fullWidth
          value={chosen?.bicycle.id ?? ''}
          onChange={(event) => changeDraft({ bicycleId: event.target.value, inUse: null, replaces: '' })}
          slotProps={NATIVE_SELECT_SLOT_PROPS}
        >
          <option value="">{t('screens.addComponent.noBicycle')}</option>
          {bicycles.map(({ bicycle }) => (
            <option key={bicycle.id} value={bicycle.id}>
              {bicycle.name}
            </option>
          ))}
        </TextField>
        {chosen && (
          <div>
            <FormControlLabel
              control={
                <Switch
                  name="inUse"
                  checked={inUse}
                  onChange={(event) => changeDraft({ inUse: event.target.checked })}
                  slotProps={{ input: { 'aria-describedby': inUseHintId } }}
                />
              }
              label={t('screens.addComponent.fields.inUse.label')}
            />
            <FormHelperText id={inUseHintId}>
              {t('screens.addComponent.fields.inUse.hint', { odometer: chosen.bicycle.odometer })}
            </FormHelperText>
          </div>
        )}
        {needsReplace && (
          <TextField
            select
            name="replaces"
            label={t('screens.addComponent.fields.replaces.label')}
            helperText={
              replacesError === null
                ? t('screens.addComponent.fields.replaces.hint')
                : getComponentErrorMessage(t, 'replaces', replacesError)
            }
            error={replacesError !== null}
            required
            fullWidth
            value={replaces}
            onChange={(event) => changeDraft({ replaces: event.target.value })}
            slotProps={NATIVE_SELECT_SLOT_PROPS}
          >
            {candidates.length > 1 && <option value="">{t('screens.addComponent.chooseReplaced')}</option>}
            {candidates.map(({ id, model, label }) => (
              <option key={id} value={id}>
                {label === null
                  ? t('screens.addComponent.replacedComponent', { model })
                  : t('screens.addComponent.replacedComponentWithLabel', { model, label })}
              </option>
            ))}
          </TextField>
        )}
      </>
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
      {bicycles.length > 0 && renderPlacement()}
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
