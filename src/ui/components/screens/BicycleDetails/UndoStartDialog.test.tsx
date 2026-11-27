import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ComponentHistoryEntry } from '@store/components/types';
import { CHAIN_IN_USE_ROW } from '@ui/components/ComponentList/__mocks__/rows';
import { theme } from '@ui/theme';

import { acceptUndo, blockedPlan, UNDO_PLAN, UNDO_SWAP_PLAN } from './__mocks__/undo';
import type { UndoStartDialogProps } from './types';
import { UndoStartDialog } from './UndoStartDialog';

/**
 * Renders the open dialog inside the app theme.
 *
 * @param props - Props that differ from undoing chain A's swap (2900 km, 1400 since installed), which brings back chain
 * B, with a store that accepts it.
 * @returns The handlers passed to the dialog, once focus has landed on **Cancel**.
 */
async function renderDialog(props: Partial<UndoStartDialogProps> = {}) {
  const onUndo = vi.fn<UndoStartDialogProps['onUndo']>(acceptUndo);
  const onClose = vi.fn<UndoStartDialogProps['onClose']>();

  render(
    <ThemeProvider theme={theme}>
      <UndoStartDialog row={CHAIN_IN_USE_ROW} plan={UNDO_SWAP_PLAN} onUndo={onUndo} onClose={onClose} {...props} />
    </ThemeProvider>,
  );

  // The focused button starts its focus ripple after the render; waiting lets it settle inside `act`.
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());

  return { onUndo, onClose };
}

/**
 * Builds a care entry of chain A.
 *
 * @param distance - Its distance.
 * @returns The entry.
 */
function careEntry(distance: number): ComponentHistoryEntry {
  return {
    id: `entry-${distance}`,
    date: '2026-04-12',
    installed: '2026-03-01',
    distance,
    position: null,
    subcomponent: null,
    lubricated: '2026-04-12',
    stretch: null,
    lubricant: 'wax',
    cleaned: null,
  };
}

describe('UndoStartDialog', () => {
  it('names the distance this component loses and the one that comes back, with focus on Cancel', async () => {
    await renderDialog();

    expect(screen.getByRole('dialog', { name: 'Undo start?' })).toHaveAccessibleDescription(
      'Chain Shimano CN-M8100 (A) loses the 1,400 km ridden since it went in use.',
    );
    expect(
      screen.getByText(
        'Chain Shimano CN-M8100 (B), which it replaced, comes back in use and gets those kilometres.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says nothing about a replacement when the start replaced nothing', async () => {
    await renderDialog({ plan: UNDO_PLAN });

    expect(screen.queryByText(/which it replaced|nothing takes its place/)).not.toBeInTheDocument();
  });

  it.each([
    ['removed', 'The component it replaced was removed, so nothing takes its place.'],
    ['retired', 'Chain Shimano CN-M8100 (B), which it replaced, was retired, so nothing takes its place.'],
    [
      'notOnBicycle',
      'Chain Shimano CN-M8100 (B), which it replaced, is no longer on this bicycle, so nothing takes its place.',
    ],
    ['usedSince', 'Chain Shimano CN-M8100 (B), which it replaced, was used again since, so nothing takes its place.'],
    [
      'noRoom',
      'Chain Shimano CN-M8100 (B), which it replaced, cannot come back because its type has no room, so nothing takes its place.',
    ],
  ] as const)('says why the replaced component cannot come back: %s', async (blockedBy, text) => {
    await renderDialog({ plan: blockedPlan(blockedBy) });

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('warns about care entries above the distance after the undo, and deletes nothing', async () => {
    const row = {
      ...CHAIN_IN_USE_ROW,
      component: { ...CHAIN_IN_USE_ROW.component, history: [careEntry(1500), careEntry(2400), careEntry(2800)] },
    };
    const { onUndo } = await renderDialog({ row });

    expect(screen.getByRole('alert')).toHaveTextContent(
      '2 care entries have a distance above 1,500 km, the distance after the undo. Check them in Care history; nothing is deleted.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('words a single care entry in the singular', async () => {
    const row = { ...CHAIN_IN_USE_ROW, component: { ...CHAIN_IN_USE_ROW.component, history: [careEntry(2400)] } };
    await renderDialog({ row });

    expect(screen.getByRole('alert')).toHaveTextContent('1 care entry has a distance above 1,500 km');
  });

  it('undoes and closes', async () => {
    const { onUndo, onClose } = await renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onUndo).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stays open with an alert when the store rejects the undo', async () => {
    const { onClose } = await renderDialog({
      onUndo: () => ({ ok: false, errors: [{ field: 'componentId', code: 'notAllowed' }] }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByRole('alert')).toHaveTextContent('The start could not be undone.');
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['Cancel', () => userEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['Escape', () => userEvent.keyboard('{Escape}')],
  ])('closes without undoing on %s', async (_name, close) => {
    const { onUndo, onClose } = await renderDialog();

    await close();

    expect(onClose).toHaveBeenCalledOnce();
    expect(onUndo).not.toHaveBeenCalled();
  });
});
