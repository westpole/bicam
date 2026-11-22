import { expect, type Page } from '@playwright/test';

/** Sub-pixel tolerance (px) for geometry checks at `dvh` heights. */
const TOLERANCE = 1;

/** How long (ms) the shell geometry may take to settle after a resize or `dvh` change. */
const LAYOUT_SETTLE_TIMEOUT = 5_000;

/**
 * Returns the element's bounding box, failing the test when it has none.
 *
 * @param page - Page that holds the element.
 * @param role - ARIA landmark role to locate.
 * @returns The bounding box in CSS px.
 * @throws Error when the element is not rendered.
 */
async function landmarkBox(page: Page, role: 'banner' | 'main') {
  const box = await page.getByRole(role).boundingBox();
  if (!box) {
    throw new Error(`The ${role} landmark has no bounding box`);
  }
  return box;
}

/**
 * The shared app-shell checks from ticket #9, all relative to the header's **measured** box (the toolbar is
 * 56, 48, or 64px depending on the viewport, so no height is hard-coded):
 *
 * - (a) The header's top edge is at y = 0 and it spans the full inner width.
 * - (b) `<main>` starts at the header's bottom edge and ends at `window.innerHeight`.
 * - (c) With tall content injected into `<main>` and `<main>` scrolled, the header box is unchanged,
 *   `main.scrollTop > 0`, and the document itself has not scrolled.
 *
 * Injects content into `<main>`, so run it last in a test (each test gets a fresh page/app).
 *
 * @param page - Page showing the app shell.
 * @example
 * await expectShellLayout(page);
 */
export async function expectShellLayout(page: Page): Promise<void> {
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();

  // (a) + (b) are retried until they hold, so a layout still settling after a resize or `dvh` change
  // does not make the measurement flaky.
  await expect(async () => {
    const viewport = await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
    const headerBox = await landmarkBox(page, 'banner');
    const mainBox = await landmarkBox(page, 'main');

    // (a) Header pinned to the top, full width.
    expect(Math.abs(headerBox.y)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(headerBox.x)).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(headerBox.width - viewport.width)).toBeLessThanOrEqual(TOLERANCE);

    // (b) Main fills the rest of the height.
    expect(Math.abs(mainBox.y - (headerBox.y + headerBox.height))).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(mainBox.y + mainBox.height - viewport.height)).toBeLessThanOrEqual(TOLERANCE);
  }).toPass({ timeout: LAYOUT_SETTLE_TIMEOUT });

  const header = await landmarkBox(page, 'banner');

  // (c) Only <main> scrolls.
  await page.getByRole('main').evaluate((element) => {
    const filler = document.createElement('div');
    filler.style.height = `${window.innerHeight * 3}px`;
    filler.textContent = 'e2e filler';
    element.append(filler);
    element.scrollTop = window.innerHeight;
  });
  await expect.poll(() => page.getByRole('main').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  expect(await page.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);
  const headerAfter = await landmarkBox(page, 'banner');
  expect(Math.abs(headerAfter.y - header.y)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(headerAfter.height - header.height)).toBeLessThanOrEqual(TOLERANCE);
  expect(Math.abs(headerAfter.width - header.width)).toBeLessThanOrEqual(TOLERANCE);
}

/**
 * Asserts that the menu button and the `<h1>` are visible and on the same row (vertical centers within 4px).
 *
 * @param page - Page showing the app shell.
 * @example
 * await expectMenuButtonBesideTitle(page);
 */
export async function expectMenuButtonBesideTitle(page: Page): Promise<void> {
  const button = page.getByRole('button', { name: 'Open menu' });
  const heading = page.getByRole('heading', { level: 1, name: 'Bicam' });
  await expect(button).toBeVisible();
  await expect(heading).toBeVisible();

  const buttonBox = await button.boundingBox();
  const headingBox = await heading.boundingBox();
  if (!buttonBox || !headingBox) {
    throw new Error('Menu button or heading has no bounding box');
  }

  expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(headingBox.x + TOLERANCE);
  expect(
    Math.abs(buttonBox.y + buttonBox.height / 2 - (headingBox.y + headingBox.height / 2)),
  ).toBeLessThanOrEqual(4);
}

/**
 * The app menu flow (design doc `docs/design/app-menu.md`):
 *
 * - (a) The menu button opens the menu: the button reads "Close menu" (✕) and the "Main menu" navigation lists the four
 *   options, top to bottom, inside `<main>`'s area below the header.
 * - (b) The ✕ button closes it again.
 * - (c) Choosing "Add bicycle" closes the menu and shows its placeholder heading in `<main>`.
 *
 * @param page - Page showing the app shell with the menu closed.
 * @example
 * await expectMenuFlow(page);
 */
export async function expectMenuFlow(page: Page): Promise<void> {
  const menu = page.getByRole('navigation', { name: 'Main menu' });
  await expect(menu).toHaveCount(0);

  // (a) Open.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('button')).toHaveText([
    'Add bicycle',
    'Add component',
    'Add clothes set',
    'Before ride check-in',
  ]);

  // Settled position: the panel starts at the header's bottom edge and fills the rest of the viewport.
  await expect(async () => {
    const header = await landmarkBox(page, 'banner');
    const panel = await menu.boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    if (!panel) {
      throw new Error('The menu has no bounding box');
    }
    expect(Math.abs(panel.y - (header.y + header.height))).toBeLessThanOrEqual(TOLERANCE);
    expect(Math.abs(panel.y + panel.height - viewportHeight)).toBeLessThanOrEqual(TOLERANCE);
  }).toPass({ timeout: LAYOUT_SETTLE_TIMEOUT });

  // (b) Close with ✕.
  await page.getByRole('button', { name: 'Close menu' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');

  // (c) Choose an option.
  await page.getByRole('button', { name: 'Open menu' }).click();
  await menu.getByRole('button', { name: 'Add bicycle' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('main').getByRole('heading', { level: 2, name: 'Add bicycle' })).toBeVisible();
}
