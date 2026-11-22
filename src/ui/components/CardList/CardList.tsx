import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  CARD_CONTENT_SX,
  CARD_SX,
  LIST_SPACING,
  LIST_SX,
  MEDIA_SX,
  SECONDARY_ROW_SX,
  TEXT_COLUMN_SX,
} from './constants';
import type { CardListProps } from './types';

/**
 * Reusable list of cards stacked vertically. Each card is an MUI `Paper` with an image on the left and two content
 * rows on the right: the title, and an optional second row that keeps its height even when empty.
 * The whole card is one native `<button>` named by its title, so Enter and Space work without extra handlers.
 * Domain-agnostic: callers map their data to items.
 *
 * @param props - See {@link CardListProps}.
 * @returns A `<ul>` of `Paper` cards.
 * @example
 * <CardList
 *   aria-label={t('home.bicycleList.label')}
 *   items={bicycles.map((bicycle) => ({ id: bicycle.id, title: bicycle.name, media: <BicycleAvatar /> }))}
 *   onItemClick={openBicycleDetails}
 * />
 */
export function CardList<Id extends string = string>({
  items,
  onItemClick,
  'aria-label': ariaLabel,
}: CardListProps<Id>) {
  return (
    <Stack component="ul" spacing={LIST_SPACING} aria-label={ariaLabel} sx={LIST_SX}>
      {items.map((item) => (
        <Paper key={item.id} component="li" elevation={1} sx={CARD_SX}>
          <ButtonBase component="button" type="button" onClick={() => onItemClick(item.id)} sx={CARD_CONTENT_SX}>
            {/* Spans, not divs: a <button> may only contain phrasing content. */}
            <Box component="span" aria-hidden sx={MEDIA_SX}>
              {item.media}
            </Box>
            <Box component="span" sx={TEXT_COLUMN_SX}>
              <Typography variant="subtitle1" component="span" noWrap>
                {item.title}
              </Typography>
              <Box component="span" sx={SECONDARY_ROW_SX}>
                {item.secondary}
              </Box>
            </Box>
          </ButtonBase>
        </Paper>
      ))}
    </Stack>
  );
}
