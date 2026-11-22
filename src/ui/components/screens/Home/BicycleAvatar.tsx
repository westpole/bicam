import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import Avatar from '@mui/material/Avatar';
import type { SxProps, Theme } from '@mui/material/styles';

/** 56 × 56 rounded square in the primary color; the icon uses the matching contrast text color. */
const AVATAR_SX: SxProps<Theme> = {
  width: 56,
  height: 56,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
};

/**
 * Image shown on the left of a bicycle card: a bike icon on a rounded primary-colored square. Decorative; the card
 * title names the bicycle. Rendered as a `<span>` because it sits inside the card's `<button>`. Will show the
 * bicycle's photo, with this icon as the fallback, once photos exist.
 *
 * @returns The bicycle avatar.
 */
export function BicycleAvatar() {
  return (
    <Avatar component="span" variant="rounded" sx={AVATAR_SX}>
      <DirectionsBikeIcon sx={{ fontSize: 32 }} />
    </Avatar>
  );
}
