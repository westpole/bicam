import { useId, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import type { UndoStartDialogProps } from './types';
import { countEntriesAbove } from './utilities/countEntriesAbove';
import { getComponentName } from './utilities/getComponentName';

/**
 * Dialog that asks before undoing a component's start (rule 10). It names the distance the component loses (everything
 * since it went in use), the component that comes back in use in its place, or why the replaced one cannot come back.
 * When care entries of the component have a distance above its distance after the undo, it says so and points to Care
 * history; it deletes nothing. Focus starts on **Cancel**, because the undo removes a period. Mount it to open it and
 * unmount it to close it.
 *
 * @param props - See {@link UndoStartDialogProps}.
 * @returns The open dialog.
 * @example
 * {row && <UndoStartDialog row={row} plan={getUndoPlan(row.component.id)} onUndo={undo} onClose={close} />}
 */
export function UndoStartDialog({ row, plan, onUndo, onClose }: UndoStartDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const { component, usage } = row;
  const lost = usage.distanceSinceInstalled ?? 0;
  const distanceAfter = Math.round((usage.distance - lost) * 10) / 10;
  const entriesAbove = countEntriesAbove(component, distanceAfter);
  // 0 hides the alert. Each failed undo raises the number, which is the alert's `key`, so it is announced again.
  const [alertKey, setAlertKey] = useState(0);

  /**
   * Says what happens to the component the start replaced, if any.
   *
   * @returns The sentence, or `null` when the start replaced nothing.
   */
  const getReplacedText = (): string | null => {
    if (!plan.ok) {
      return null;
    }

    if (plan.restored) {
      return t('screens.bicycleDetails.undoStart.restored', { name: getComponentName(t, plan.restored) });
    }

    if (plan.blockedBy === null) {
      return null;
    }

    // A removed component has no name left to show. Each `UndoBlockReason` has its own key under
    // `undoStart.blocked`; a new reason needs a new key there (the type check fails until it exists).
    return plan.replaced === null
      ? t('screens.bicycleDetails.undoStart.blocked.removed')
      : t(`screens.bicycleDetails.undoStart.blocked.${plan.blockedBy}`, { name: getComponentName(t, plan.replaced) });
  };

  const handleUndo = () => {
    if (onUndo().ok) {
      onClose();
      return;
    }

    setAlertKey((current) => current + 1);
  };

  const replacedText = getReplacedText();

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
      aria-describedby={`${titleId}-lost`}
    >
      <DialogTitle id={titleId}>{t('screens.bicycleDetails.undoStart.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText id={`${titleId}-lost`} sx={{ overflowWrap: 'anywhere' }}>
            {t('screens.bicycleDetails.undoStart.lost', { name: getComponentName(t, component), distance: lost })}
          </DialogContentText>
          {replacedText !== null && (
            <DialogContentText sx={{ overflowWrap: 'anywhere' }}>{replacedText}</DialogContentText>
          )}
          {entriesAbove > 0 && (
            <Alert severity="warning">
              {t('screens.bicycleDetails.undoStart.careWarning', { count: entriesAbove, distance: distanceAfter })}
            </Alert>
          )}
          {alertKey > 0 && (
            <Alert key={alertKey} severity="error">
              {t('screens.bicycleDetails.undoStart.error')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" autoFocus onClick={onClose}>
          {t('screens.bicycleDetails.undoStart.cancel')}
        </Button>
        <Button type="button" variant="contained" onClick={handleUndo}>
          {t('screens.bicycleDetails.undoStart.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
