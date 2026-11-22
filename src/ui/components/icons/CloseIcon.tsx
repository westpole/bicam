import { createSvgIcon } from '@mui/material/utils';

/**
 * "X" close icon: two crossing diagonal bars as an inline `<svg viewBox="0 0 24 24">`.
 *
 * Built with `createSvgIcon`, like {@link MenuIcon}: it fills with `currentColor`, sizes in `em` via `fontSize` or
 * `sx`, stays crisp at any DPI, and is decorative (`aria-hidden`). Give the wrapping control an accessible name.
 * Local on purpose: `@mui/icons-material` is not a dependency.
 *
 * @example
 * <IconButton aria-label={t('header.menuButton.closeLabel')}><CloseIcon /></IconButton>
 */
export const CloseIcon = createSvgIcon(
  <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
  'Close',
);
