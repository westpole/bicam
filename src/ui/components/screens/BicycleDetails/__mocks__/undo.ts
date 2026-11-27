import type { ComponentUndoPlan, ComponentUndoResult } from '@store/components/types';
import { CHAIN_IN_USE_ROW, CHAIN_RESTING_ROW } from '@ui/components/ComponentList/__mocks__/rows';

/** An undo that can be written. */
type AcceptedUndoPlan = Extract<ComponentUndoPlan, { ok: true }>;

/** Undoing chain A's swap brings back chain B, which it replaced. */
export const UNDO_SWAP_PLAN: AcceptedUndoPlan = {
  ok: true,
  component: { ...CHAIN_IN_USE_ROW.component, usage: [] },
  changed: [],
  replaced: CHAIN_RESTING_ROW.component,
  restored: CHAIN_RESTING_ROW.component,
  blockedBy: null,
};

/** Undoing a start that replaced nothing. */
export const UNDO_PLAN: AcceptedUndoPlan = { ...UNDO_SWAP_PLAN, replaced: null, restored: null };

/**
 * Builds the plan of an undo whose replaced component cannot come back.
 *
 * @param blockedBy - Why not.
 * @returns The plan; for `removed` without a replaced component.
 */
export function blockedPlan(blockedBy: NonNullable<AcceptedUndoPlan['blockedBy']>): AcceptedUndoPlan {
  return {
    ...UNDO_SWAP_PLAN,
    replaced: blockedBy === 'removed' ? null : CHAIN_RESTING_ROW.component,
    restored: null,
    blockedBy,
  };
}

/**
 * Stands in for a store that accepts every undo.
 *
 * @returns A successful result, with chain B back in use.
 */
export const acceptUndo = (): ComponentUndoResult => ({
  ok: true,
  component: UNDO_SWAP_PLAN.component,
  restored: CHAIN_RESTING_ROW.component,
});
