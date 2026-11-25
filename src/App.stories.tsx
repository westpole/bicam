import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { INITIAL_APP_STATE } from '@store/constants';
import type { AppStoreState } from '@store/types';
import { useAppStore } from '@store/useAppStore';
import { BICYCLES, MANY_BICYCLES, toBicycleCollection } from '@ui/components/screens/Home/__mocks__/bicycles';

import { App } from './App';

/** Typed story args: store fields to seed on top of the baseline. */
interface StoryArgs {
  initialState: Partial<AppStoreState>;
}

const meta = {
  title: 'Screens/App',
  component: App,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  args: {
    initialState: {},
  } satisfies StoryArgs,
  decorators: [
    (Story, context) => {
      const { initialState } = context.args as StoryArgs;

      useEffect(() => {
        // Reset to the baseline first, then apply story overrides, so no state bleeds between stories.
        useAppStore.setState({ ...INITIAL_APP_STATE, ...initialState });
      }, [initialState]);

      return <Story />;
    },
  ],
} satisfies Meta<typeof App>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Asserts the closed shell: banner, menu button, and the app title.
 *
 * @param canvas - The story canvas queries.
 */
async function expectClosedShell(canvas: Parameters<NonNullable<Story['play']>>[0]['canvas']) {
  await expect(canvas.getByRole('banner')).toBeVisible();
  await expect(canvas.getByRole('button', { name: 'Open menu' })).toBeVisible();
  await expect(canvas.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
}

/**
 * Full menu flow: open, close with ✕, reopen, choose "Before ride check-in", and see its placeholder.
 *
 * @param context - The story context.
 */
async function playMenuFlow({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0]) {
  await expectClosedShell(canvas);
  const main = canvasElement.querySelector('main') as HTMLElement;

  await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
  const menu = await canvas.findByRole('navigation', { name: 'Main menu' });
  await expect(canvas.getByRole('button', { name: 'Close menu' })).toBeVisible();
  await expect(main).toHaveAttribute('inert');
  await waitFor(() => expect(within(menu).getByRole('button', { name: 'Add bicycle' })).toHaveFocus());

  await userEvent.click(canvas.getByRole('button', { name: 'Close menu' }));
  await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());

  await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
  await userEvent.click(await canvas.findByRole('button', { name: 'Before ride check-in' }));
  await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());
  await expect(within(main).getByRole('heading', { level: 2, name: 'Before ride check-in' })).toBeVisible();
  await expect(main).not.toHaveAttribute('inert');
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
}

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: async ({ canvas }) => {
    await expectClosedShell(canvas);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: async ({ canvas }) => {
    await expectClosedShell(canvas);
  },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async ({ canvas, canvasElement }) => {
    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await expectClosedShell(canvas);
  },
};

export const MenuFlow: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  play: playMenuFlow,
};

export const MenuFlowMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  play: playMenuFlow,
};

/** Seeded from the store: menu open over the "Add bicycle" screen, which is marked current. */
export const MenuOpenDark: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false }, colorScheme: 'dark' },
  args: { initialState: { isMenuOpen: true, activeScreen: 'addBicycle' } },
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    const menu = await canvas.findByRole('navigation', { name: 'Main menu' });
    await expect(canvas.getByRole('button', { name: 'Close menu' })).toBeVisible();
    await expect(within(menu).getByRole('button', { current: 'page' })).toHaveAccessibleName('Add bicycle');
  },
};

/** Seeded from the store: the home screen lists the stored bicycles as cards under the header. */
export const HomeWithBicycles: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { initialState: { bicycle: toBicycleCollection(BICYCLES) } },
  play: async ({ canvas, canvasElement }) => {
    await expectClosedShell(canvas);
    const main = canvasElement.querySelector('main') as HTMLElement;
    const list = await within(main).findByRole('list', { name: 'Bicycles' });
    await expect(within(list).getAllByRole('button')).toEqual(
      ['Gravel Grinder', 'Roadie', 'Commuter'].map((name) => within(list).getByRole('button', { name })),
    );
    // The list starts below the header.
    const header = canvas.getByRole('banner').getBoundingClientRect();
    await expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.bottom);
  },
};

/**
 * Home → details flow: click the second card, see its details placeholder, leave it through the menu, then go back
 * home with the title link.
 *
 * @param context - The story context.
 */
async function playHomeToDetails({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0]) {
  const main = canvasElement.querySelector('main') as HTMLElement;
  await within(main).findByRole('list', { name: 'Bicycles' });

  await userEvent.click(canvas.getByRole('button', { name: 'Roadie' }));
  await expect(within(main).getByRole('heading', { level: 2, name: 'Roadie' })).toBeVisible();
  await expect(within(main).getByText('This screen is coming soon.')).toBeVisible();
  await expect(within(main).queryByRole('list', { name: 'Bicycles' })).not.toBeInTheDocument();
  await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);

  await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
  await userEvent.click(await canvas.findByRole('button', { name: 'Add bicycle' }));
  await waitFor(() => expect(canvas.queryByRole('navigation')).not.toBeInTheDocument());
  await expect(within(main).getByRole('heading', { level: 2, name: 'Add bicycle' })).toBeVisible();

  await userEvent.click(canvas.getByRole('link', { name: 'Bicam' }));
  await expect(within(main).getByRole('list', { name: 'Bicycles' })).toBeVisible();
}

export const HomeToDetails: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { initialState: { bicycle: toBicycleCollection(BICYCLES) } },
  play: playHomeToDetails,
};

export const HomeToDetailsMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { initialState: { bicycle: toBicycleCollection(BICYCLES) } },
  play: playHomeToDetails,
};

/**
 * Add bicycle flow: a rejected save shows the errors, the corrected one lands on the home list.
 *
 * @param context - The story context.
 */
async function playAddBicycle({ canvas, canvasElement, userEvent }: Parameters<NonNullable<Story['play']>>[0]) {
  const main = canvasElement.querySelector('main') as HTMLElement;
  await expect(await within(main).findByRole('heading', { level: 2, name: 'Add bicycle' })).toBeVisible();

  await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), 'Roadie');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Company' }), 'Trek');
  await userEvent.type(canvas.getByRole('textbox', { name: 'Model' }), 'Madone');
  await userEvent.click(canvas.getByRole('button', { name: 'Save bicycle' }));
  await expect(canvas.getByText('Another bicycle already has this name.')).toBeVisible();

  await userEvent.type(canvas.getByRole('textbox', { name: 'Name' }), ' 2');
  await userEvent.click(canvas.getByRole('button', { name: 'Save bicycle' }));
  const list = await within(main).findByRole('list', { name: 'Bicycles' });
  await expect(within(list).getByRole('button', { name: 'Roadie 2' })).toBeVisible();
}

export const AddBicycleFlow: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
  args: { initialState: { activeScreen: 'addBicycle', bicycle: toBicycleCollection(BICYCLES) } },
  play: playAddBicycle,
};

export const AddBicycleFlowMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { initialState: { activeScreen: 'addBicycle', bicycle: toBicycleCollection(BICYCLES) } },
  play: playAddBicycle,
};

/** More cards than fit: `<main>` scrolls while the header stays put. */
export const HomeScrollsMobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { initialState: { bicycle: toBicycleCollection(MANY_BICYCLES) } },
  play: async ({ canvas, canvasElement }) => {
    const main = canvasElement.querySelector('main') as HTMLElement;
    await within(main).findByRole('list', { name: 'Bicycles' });
    await expect(main.scrollHeight).toBeGreaterThan(main.clientHeight);

    const headerTop = canvas.getByRole('banner').getBoundingClientRect().top;
    main.scrollTop = main.scrollHeight;
    await waitFor(() => expect(main.scrollTop).toBeGreaterThan(0));
    await expect(canvas.getByRole('banner').getBoundingClientRect().top).toBe(headerTop);
  },
};
