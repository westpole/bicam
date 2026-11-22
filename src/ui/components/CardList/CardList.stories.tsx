import type { Meta, StoryObj } from '@storybook/react-vite';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { expect, waitFor, within } from 'storybook/test';

import { CardList } from './CardList';

/**
 * Neutral stand-in image, so the generic component's stories do not depend on any domain icon.
 *
 * @param props.letter - Letter shown in the avatar.
 * @returns A rounded avatar.
 */
function LetterMedia({ letter }: { letter: string }) {
  return (
    <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
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
  },
  play: async ({ args, canvas, canvasElement }) => {
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

    // Nothing overflows horizontally, even on the narrowest viewport.
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
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
