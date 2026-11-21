import { createSvgIcon } from '@mui/material/utils';

/**
 * "Hamburger" menu icon: three equal horizontal bars as an inline `<svg viewBox="0 0 24 24">`.
 *
 * Built with `createSvgIcon`, so it behaves like any MUI `SvgIcon`: it fills with `currentColor` (picks up the
 * surrounding text color in both color schemes), sizes in `em` via `fontSize` (`small | medium | large`) or `sx`,
 * stays crisp at any DPI, and is decorative (`aria-hidden`). Give the wrapping control an accessible name.
 * Local on purpose: `@mui/icons-material` is not a dependency.
 *
 * @example
 * <IconButton aria-label={t('header.menuButton.label')}><MenuIcon /></IconButton>
 */
export const MenuIcon = createSvgIcon(<path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />, 'Menu');
