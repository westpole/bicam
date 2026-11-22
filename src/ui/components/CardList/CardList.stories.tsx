import type { Meta, StoryObj } from '@storybook/react-vite';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { expect, fn, waitFor, within } from 'storybook/test';

import { CardList } from './CardList';

/** 56 × 56 rounded square in the primary color, like the real bicycle avatar. */
const LETTER_MEDIA_SX = { width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText' } as const;

/**
 * Neutral stand-in image, so the generic component's stories do not depend on any domain icon.
 *
 * @param props.letter - Letter shown in the avatar.
 * @returns A rounded avatar.
 */
function LetterMedia({ letter }: { letter: string }) {
  return (
    <Avatar component="span" variant="rounded" sx={LETTER_MEDIA_SX}>
      {letter}
    </Avatar>
  );
}

const meta = {
  title: 'Components/CardList',
  component: CardList,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  decorators: [
    // Same padding `<main>` gives its content in the app.
    (Story) => (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Story />
      </Box>
    ),
  ],
  args: {
    'aria-label': 'Example cards',
    items: [
      { id: 'chain', title: 'Chain', media: <LetterMedia letter="C" /> },
      { id: 'cassette', title: 'Cassette', media: <LetterMedia letter="K" /> },
      { id: 'brakePads', title: 'Brake pads', media: <LetterMedia letter="B" /> },
    ],
    onItemClick: fn(),
  },
  play: async ({ args, canvas, canvasElement, userEvent }) => {
    const list = canvas.getByRole('list', { name: 'Example cards' });
    const cards = within(list).getAllByRole('listitem');
    await expect(cards).toHaveLength(args.items.length);

    // Cards stack top to bottom with a 12px gap, share the left edge, and span the list width.
    const listWidth = list.getBoundingClientRect().width;
    const boxes = cards.map((card) => card.getBoundingClientRect());
    for (let i = 1; i < boxes.length; i += 1) {
      await expect(Math.round(boxes[i].top - boxes[i - 1].bottom)).toBe(12);
      await expect(boxes[i].left).toBe(boxes[0].left);
    }
    for (const box of boxes) {
      await expect(Math.abs(box.width - listWidth)).toBeLessThanOrEqual(1);
    }

    // The media sits to the left of the title.
    const media = cards[0].querySelector('[aria-hidden="true"]') as HTMLElement;
    const title = within(cards[0]).getByText(args.items[0].title);
    await expect(media.getBoundingClientRect().right).toBeLessThanOrEqual(title.getBoundingClientRect().left);

    // Each card is one button that fills its Paper and is named by its title.
    for (const [index, card] of cards.entries()) {
      const button = within(card).getByRole('button', { name: args.items[index].title });
      await expect(Math.abs(button.getBoundingClientRect().width - boxes[index].width)).toBeLessThanOrEqual(1);
    }

    // Nothing overflows horizontally, even on the narrowest viewport.
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);

    // Click and keyboard both report the card's id; keyboard focus shows an outline.
    const last = args.items[args.items.length - 1];
    await userEvent.click(canvas.getByRole('button', { name: last.title }));
    await expect(args.onItemClick).toHaveBeenLastCalledWith(last.id);
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    const focused = canvas.getByRole('button', { name: last.title });
    await expect(focused).toHaveFocus();
    await expect(getComputedStyle(focused).outlineStyle).toBe('solid');
    // The outline follows the card's rounded corners.
    await expect(getComputedStyle(focused).borderRadius).toBe(getComputedStyle(cards[cards.length - 1]).borderRadius);
    await userEvent.keyboard('{Enter}');
    await expect(args.onItemClick).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(' ');
    await expect(args.onItemClick).toHaveBeenCalledTimes(3);
  },
} satisfies Meta<typeof CardList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};

/** A long title stays on one line with an ellipsis on the narrowest phone. */
export const LongTitle: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: {
    items: [
      { id: 'long', title: 'Commuter with a very long name for tests', media: <LetterMedia letter="L" /> },
      { id: 'chain', title: 'Chain', media: <LetterMedia letter="C" /> },
      { id: 'cassette', title: 'Cassette', media: <LetterMedia letter="K" /> },
    ],
  },
  play: async (context) => {
    await meta.play(context);
    const title = context.canvas.getByText('Commuter with a very long name for tests');
    await expect(getComputedStyle(title).textOverflow).toBe('ellipsis');
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
  },
};
