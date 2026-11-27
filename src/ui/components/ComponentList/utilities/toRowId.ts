import type { ComponentId } from '@store/components/types';

/**
 * Builds the `id` of a {@link ComponentList} row, so a screen can find the row and move focus to it.
 *
 * @param prefix - The list's `rowIdPrefix`.
 * @param componentId - The component shown in the row.
 * @returns The element id.
 * @example
 * document.getElementById(toRowId(prefix, component.id))?.focus();
 */
export function toRowId(prefix: string, componentId: ComponentId): string {
  return `${prefix}-row-${componentId}`;
}
