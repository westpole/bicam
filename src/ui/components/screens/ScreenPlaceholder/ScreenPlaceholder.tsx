import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { ScreenPlaceholderProps } from './types';

/**
 * Shared body of a not-yet-built screen: the screen title as an `<h2>` (the app title stays the only `<h1>`) and a
 * "coming soon" line. Long titles wrap instead of overflowing.
 *
 * @param props - See {@link ScreenPlaceholderProps}.
 * @returns The placeholder content for `<main>`.
 * @example
 * <ScreenPlaceholder title={t('screens.addBicycle.title')} />
 */
export function ScreenPlaceholder({ title }: ScreenPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="h5" component="h2" sx={{ overflowWrap: 'anywhere' }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary' }}>
        {t('screens.placeholder.body')}
      </Typography>
    </Stack>
  );
}
