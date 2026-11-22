import { useMemo } from 'react';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { CardList } from '@ui/components/CardList/CardList';
import type { CardListItem } from '@ui/components/CardList/types';

import { BicycleAvatar } from './BicycleAvatar';
import type { HomeProps } from './types';

/**
 * Start screen: the user's bicycles as a vertical list of cards, each with a bike image, the bicycle's name,
 * and an "events placeholder" second row.
 * Activating a card reports that bicycle's id. Renders nothing when there are no bicycles, so the main viewport
 * stays empty on a fresh start.
 *
 * @param props - See {@link HomeProps}.
 * @returns The bicycle card list, or `null` when there are no bicycles.
 * @example
 * <Home bicycles={bicycles} onBicycleClick={openBicycleDetails} />
 */
export function Home({ bicycles, onBicycleClick }: HomeProps) {
  const { t } = useTranslation();

  const items = useMemo<CardListItem[]>(
    () =>
      bicycles.map((bicycle) => ({
        id: bicycle.id,
        title: bicycle.name,
        media: <BicycleAvatar />,
        // Stand-in for the event icons (design doc §8.1). Hidden from assistive tech so the card keeps the
        // bicycle's name as its accessible name.
        secondary: (
          <Typography variant="body2" component="span" color="text.secondary" aria-hidden noWrap>
            {t('home.bicycleList.eventsPlaceholder')}
          </Typography>
        ),
      })),
    [bicycles, t],
  );

  if (items.length === 0) {
    return null;
  }

  return <CardList aria-label={t('home.bicycleList.label')} items={items} onItemClick={onBicycleClick} />;
}
