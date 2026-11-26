import { getComponentsInUse } from '@store/components/utilities/getComponentsInUse';
import { hasRoomForType } from '@store/components/utilities/hasRoomForType';
import { isBicycleComponentType } from '@store/components/utilities/isBicycleComponentType';

import type { AddComponentBicycle, AddComponentPlacementDraft, ResolvedPlacement } from '../types';

/**
 * Applies the defaults to the placement fields (rule 2 in `docs/store/components.md` §2.3):
 *
 * - A bicycle that is no longer offered counts as none.
 * - "In use now" follows the rider's choice, or is on when the type has room on the chosen bicycle. Without a known
 *   type it is on, because there is nothing to count yet.
 * - When it is on and the type is full, the form asks which component to replace. A choice that is no longer a
 *   candidate is dropped; with one candidate, it is preselected.
 *
 * @param bicycles - The bicycles the form offers.
 * @param type - The chosen type, as typed (`''` when none).
 * @param draft - The placement fields as chosen.
 * @returns The placement as shown.
 * @example
 * const draft = { bicycleId: bicycle.id, inUse: null, replaces: '' };
 * resolvePlacement([{ bicycle, components: [chainInUse] }], 'chain', draft);
 * // { chosen, inUse: false, candidates: [chainInUse], needsReplace: false, replaces: '' }
 */
export function resolvePlacement(
  bicycles: readonly AddComponentBicycle[],
  type: string,
  draft: AddComponentPlacementDraft,
): ResolvedPlacement {
  const chosen = bicycles.find(({ bicycle }) => bicycle.id === draft.bicycleId);
  const knownType = isBicycleComponentType(type) ? type : null;
  const candidates = chosen && knownType ? getComponentsInUse(chosen.components, knownType) : [];
  const hasRoom = !chosen || knownType === null || hasRoomForType(chosen.components, knownType);
  const inUse = chosen !== undefined && (draft.inUse ?? hasRoom);
  const needsReplace = inUse && !hasRoom;
  let replaces = '';

  if (needsReplace) {
    if (candidates.some(({ id }) => id === draft.replaces)) {
      replaces = draft.replaces;
    } else if (candidates.length === 1) {
      replaces = candidates[0].id;
    }
  }

  return { chosen, inUse, candidates, needsReplace, replaces };
}
