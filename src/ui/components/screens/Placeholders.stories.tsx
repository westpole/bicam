import type { Meta, StoryObj } from '@storybook/react-vite';
import Box from '@mui/material/Box';
import { expect, waitFor } from 'storybook/test';

import type { MenuScreen } from '@store/types';

import { SCREEN_COMPONENTS } from './constants';

/** Story args: which placeholder screen to show. */
interface PlaceholderStoryArgs {
  screen: MenuScreen;
}

/** Expected `<h2>` text per screen (English). */
const TITLES: Record<MenuScreen, string> = {
  addBicycle: 'Add bicycle',
  addComponent: 'Add component',
  addClothesSet: 'Add clothes set',
  beforeRideCheckIn: 'Before ride check-in',
};

/**
 * Renders the placeholder for the chosen screen with the same padding `<main>` gives it in the app.
 *
 * @param props.screen - The menu screen to render.
 * @returns The placeholder screen.
 */
function PlaceholderScreen({ screen }: PlaceholderStoryArgs) {
  const Screen = SCREEN_COMPONENTS[screen];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Screen />
    </Box>
  );
}

const meta = {
  title: 'Screens/Placeholders',
  component: PlaceholderScreen,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  argTypes: {
    screen: { control: 'select', options: Object.keys(SCREEN_COMPONENTS) },
  },
  args: { screen: 'addBicycle' },
  play: async ({ args, canvas, canvasElement }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: TITLES[args.screen] });
    await expect(heading).toBeVisible();
    await expect(canvas.getByText('This screen is coming soon.')).toBeVisible();

    // Nothing overflows horizontally, even on the narrowest viewport.
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
} satisfies Meta<typeof PlaceholderScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AddBicycleDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { screen: 'addBicycle' },
};

export const AddBicycleMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { screen: 'addBicycle' },
};

export const AddComponentDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { screen: 'addComponent' },
};

export const AddComponentMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { screen: 'addComponent' },
};

export const AddClothesSetDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { screen: 'addClothesSet' },
};

export const AddClothesSetMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { screen: 'addClothesSet' },
};

export const BeforeRideCheckInDesktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { screen: 'beforeRideCheckIn' },
};

/** The longest title on the narrowest viewport (320px). */
export const BeforeRideCheckInMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { screen: 'beforeRideCheckIn' },
};

export const Dark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { screen: 'beforeRideCheckIn' },
  play: async (context) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(context.canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);
  },
};
