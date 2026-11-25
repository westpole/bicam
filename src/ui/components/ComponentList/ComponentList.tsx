import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { ROW_TEXT_SX } from './constants';
import type { ComponentListProps } from './types';

/**
 * Read-only list of bicycle components, one row each: the translated type with the model under it. Rows are not
 * interactive. Callers handle the empty case.
 *
 * @param props - See {@link ComponentListProps}.
 * @returns A `<ul>` on a `Paper`.
 * @example
 * <ComponentList aria-labelledby={headingId} components={components} />
 */
export function ComponentList({ components, 'aria-labelledby': ariaLabelledby }: ComponentListProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={1}>
      <List aria-labelledby={ariaLabelledby} disablePadding>
        {components.map(({ id, type, model }, index) => (
          <ListItem key={id} divider={index < components.length - 1}>
            <ListItemText primary={t(`components.types.${type}`)} secondary={model} sx={ROW_TEXT_SX} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
