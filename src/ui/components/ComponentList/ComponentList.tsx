import { Fragment } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import {
  FACT_REACHED_SX,
  FACT_TERM_SX,
  FACT_UNKNOWN_SX,
  FACT_VALUE_SX,
  FACTS_SX,
  ROW_CONTENT_SX,
  ROW_SX,
  ROW_TEXT_SX,
} from './constants';
import type { ComponentFact, ComponentListProps } from './types';
import { getRowFacts } from './utilities/getRowFacts';
import { toRowId } from './utilities/toRowId';

/**
 * Picks the style of a fact's value.
 *
 * @param fact - The fact.
 * @returns The `sx` of its `<dd>`.
 */
function getValueSx({ isUnknown, isReached }: ComponentFact) {
  if (isUnknown) {
    return FACT_UNKNOWN_SX;
  }

  return isReached ? FACT_REACHED_SX : FACT_VALUE_SX;
}

/**
 * List of bicycle components, one row each: the translated type, the model under it, then labelled values: the label
 * (when set), the distance, the distance since installed (in use), and for chains the lubricant and the stretch,
 * lubrication, and cleaning against their limits. A reached limit is said in text. Each row can end with an action
 * from `renderAction`. Callers handle the empty case.
 *
 * @param props - See {@link ComponentListProps}.
 * @returns A `<ul>` on a `Paper`.
 * @example
 * <ComponentList aria-labelledby={headingId} rows={rows} renderAction={(row) => <Button>Use now</Button>} />
 */
export function ComponentList({
  rows,
  renderAction,
  rowIdPrefix,
  'aria-labelledby': ariaLabelledby,
}: ComponentListProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={1}>
      <List aria-labelledby={ariaLabelledby} disablePadding>
        {rows.map((row, index) => {
          const { id, type, model } = row.component;
          const action = renderAction?.(row);

          return (
            <ListItem
              key={id}
              id={rowIdPrefix === undefined ? undefined : toRowId(rowIdPrefix, id)}
              tabIndex={rowIdPrefix === undefined ? undefined : -1}
              divider={index < rows.length - 1}
              sx={ROW_SX}
            >
              <Stack direction="row" spacing={1} useFlexGap sx={ROW_CONTENT_SX}>
                <Box sx={ROW_TEXT_SX}>
                  <Typography variant="body1">{t(`components.types.${type}`)}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {model}
                  </Typography>
                  <Box component="dl" sx={FACTS_SX}>
                    {getRowFacts(t, row).map((fact) => (
                      <Fragment key={fact.key}>
                        <Typography variant="body2" component="dt" sx={FACT_TERM_SX}>
                          {fact.term}
                        </Typography>
                        <Typography variant="body2" component="dd" sx={getValueSx(fact)}>
                          {fact.value}
                        </Typography>
                      </Fragment>
                    ))}
                  </Box>
                </Box>
                {action}
              </Stack>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}
