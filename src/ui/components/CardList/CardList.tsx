import Box from '@mui/material/Box';
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
 * rows on the right: the title, and a second row reserved for icons (empty for now, but it keeps its height).
 * Domain-agnostic: callers map their data to items.
 *
 * @param props - See {@link CardListProps}.
 * @returns A `<ul>` of `Paper` cards.
 * @example
 * <CardList
 *   aria-label={t('home.bicycleList.label')}
 *   items={bicycles.map((bicycle) => ({ id: bicycle.id, title: bicycle.name, media: <BicycleAvatar /> }))}
 * />
 */
export function CardList<Id extends string = string>({ items, 'aria-label': ariaLabel }: CardListProps<Id>) {
  return (
    <Stack component="ul" spacing={LIST_SPACING} aria-label={ariaLabel} sx={LIST_SX}>
      {items.map((item) => (
        <Paper key={item.id} component="li" elevation={1} sx={CARD_SX}>
          <Box sx={CARD_CONTENT_SX}>
            <Box aria-hidden sx={MEDIA_SX}>
              {item.media}
            </Box>
            <Box sx={TEXT_COLUMN_SX}>
              <Typography variant="subtitle1" component="span" noWrap>
                {item.title}
              </Typography>
              <Box sx={SECONDARY_ROW_SX} />
            </Box>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
