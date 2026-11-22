import type { Meta, StoryObj } from '@storybook/react-vite';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { expect, waitFor, within } from 'storybook/test';

import { theme } from '@ui/theme';

import { AppHeader } from '../AppHeader/AppHeader';
import { AppShell } from './AppShell';
import longContent from './__mocks__/longContent.json';

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
  },
  args: {
    header: <AppHeader />,
    children: (
      <Stack spacing={2}>
        {longContent.map((entry) => (
          <Paper key={entry} variant="outlined" sx={{ p: 2 }}>
            {entry}
          </Paper>
        ))}
      </Stack>
    ),
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const doc = canvasElement.ownerDocument;
    const banner = canvas.getByRole('banner');
    await expect(banner).toBeVisible();

    const main = canvas.getByRole('main');
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute('tabindex', '0');
    await expect(main.scrollHeight).toBeGreaterThan(main.clientHeight);

    // Only <main> scrolls: the header stays put and the document itself never scrolls.
    const bannerTopBefore = banner.getBoundingClientRect().top;
    main.scrollTop = 200;
    await waitFor(() => expect(main.scrollTop).toBeGreaterThan(0));
    await expect(doc.scrollingElement?.scrollTop).toBe(0);
    await expect(banner.getBoundingClientRect().top).toBe(bannerTopBefore);
    await expect(Math.abs(banner.getBoundingClientRect().top)).toBeLessThanOrEqual(1);

    // Keyboard users reach <main> as the second tab stop (after the menu button) and see a focus outline.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Open menu' })).toHaveFocus();
    await userEvent.tab();
    await expect(main).toHaveFocus();
    await expect(getComputedStyle(main).outlineStyle).not.toBe('none');
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false } },
};

export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};

/** `mobile1` rotated (568 × 320): narrower than 600px in landscape, so the toolbar is 48px. */
export const MobileLandscape: Story = {
  // An explicit viewport rather than `mobile1` + `isRotated`: the Vitest runner ignores `isRotated`.
  parameters: {
    viewport: {
      options: {
        mobile1Landscape: {
          name: 'Small mobile (landscape)',
          styles: { width: '568px', height: '320px' },
          type: 'mobile',
        },
      },
    },
  },
  globals: { viewport: { value: 'mobile1Landscape', isRotated: false } },
  play: async (context) => {
    await meta.play(context);

    const win = context.canvasElement.ownerDocument.defaultView as Window;
    await expect(win.innerWidth).toBeGreaterThan(win.innerHeight);
    await expect(win.innerWidth).toBeLessThan(theme.breakpoints.values.sm);

    // Expected height comes from the theme's landscape toolbar mixin, not a hard-coded value.
    // Shape: { [breakpoints.up('xs')]: { '@media (orientation: landscape)': { minHeight } } }.
    const xsRules = theme.mixins.toolbar[theme.breakpoints.up('xs')] as Record<string, { minHeight: number }> | undefined;
    const landscapeMixin = xsRules?.['@media (orientation: landscape)'];
    const toolbar = within(context.canvas.getByRole('banner')).getByRole('heading').parentElement as HTMLElement;
    await expect(landscapeMixin).toBeDefined();
    await expect(toolbar.getBoundingClientRect().height).toBe(landscapeMixin?.minHeight);
  },
};

export const Dark: Story = {
  globals: { viewport: { value: 'desktop', isRotated: false }, colorScheme: 'dark' },
  play: async (context) => {
    const { canvas, canvasElement } = context;

    // The preview decorator applies the mode in an effect, so wait for the switch.
    await waitFor(() => expect(canvasElement.ownerDocument.documentElement).toHaveClass('dark'));
    await meta.play(context);

    // Dark AppBar uses MUI's dark default (`enableColorOnDark` off): the dark `background.paper` token
    // (#161D1D) from the design doc §4.2, not the dark `primary.main` (#4DB6AC).
    const banner = canvas.getByRole('banner');
    await waitFor(() => expect(getComputedStyle(banner).backgroundColor).toBe('rgb(22, 29, 29)'));
    await expect(getComputedStyle(banner).backgroundColor).not.toBe('rgb(77, 182, 172)');
  },
};
