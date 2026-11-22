import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import type { VerticalListProps } from './types';

/**
 * Reusable list of labelled rows stacked vertically, each a full-width native `<button>` (so Enter and Space work
 * without extra handlers). The row matching `selectedId` gets MUI `selected` styling and `aria-current="page"`, so
 * the state is not conveyed by color alone. Rows keep MUI's 48px minimum height (WCAG 2.5.5 touch target).
 *
 * @param props - See {@link VerticalListProps}.
 * @returns A `<ul>` of button rows.
 * @example
 * <VerticalList
 *   aria-label={t('menu.label')}
 *   items={[{ id: 'addBicycle', label: t('menu.items.addBicycle') }]}
 *   selectedId={activeScreen}
 *   onItemClick={navigateTo}
 *   divided
 * />
 */
export function VerticalList<Id extends string = string>({
  items,
  onItemClick,
  selectedId,
  'aria-label': ariaLabel,
  divided = false,
  dense = false,
}: VerticalListProps<Id>) {
  return (
    <List aria-label={ariaLabel} dense={dense} disablePadding>
      {items.map((item) => {
        const selected = item.id === selectedId;

        return (
          <ListItem key={item.id} disablePadding divider={divided}>
            <ListItemButton
              component="button"
              type="button"
              selected={selected}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onItemClick(item.id)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
