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
 * - (c) Choosing "Add bicycle" closes the menu and shows its heading in `<main>`.
 * - (d) Clicking the app title leaves that screen for the home screen without changing the URL.
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
  const screenHeading = page.getByRole('main').getByRole('heading', { level: 2, name: 'Add bicycle' });
  await expect(screenHeading).toBeVisible();

  // (d) Back home through the title link.
  const url = page.url();
  await page.getByRole('link', { name: 'Bicam' }).click();
  await expect(screenHeading).toHaveCount(0);
  expect(page.url()).toBe(url);
}

/**
 * The add bicycle flow (design doc `docs/design/add-bicycle.md`):
 *
 * - (a) Saving with a half-typed purchase date and no model is rejected; both fields are marked invalid.
 * - (b) The corrected form is saved and the new bicycle is listed on the home screen.
 *
 * @param page - Page showing the app shell with the menu closed and no bicycles.
 * @example
 * await expectAddBicycleFlow(page);
 */
export async function expectAddBicycleFlow(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('button', { name: 'Add bicycle' }).click();

  // (a) Rejected: the browser reports a half-typed date as an empty value, which must not be saved as "unknown".
  const date = page.getByLabel('Purchase date');
  await page.getByRole('textbox', { name: 'Name' }).fill('Gravel Grinder');
  await page.getByRole('textbox', { name: 'Company' }).fill('Canyon');
  await date.focus();
  await date.pressSequentially('05');
  await page.getByRole('button', { name: 'Save bicycle' }).click();
  await expect(date).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('textbox', { name: 'Model' })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('textbox', { name: 'Model' })).toBeFocused();

  // (b) Saved.
  await page.getByRole('textbox', { name: 'Model' }).fill('Grizl');
  await date.fill('2024-05-17');
  await page.getByRole('button', { name: 'Save bicycle' }).click();
  await expect(page.getByRole('list', { name: 'Bicycles' }).getByRole('button')).toHaveText([/Gravel Grinder/]);
}

/**
 * The include component flow (design doc `docs/design/bicycle-details.md`). Run it right after
 * {@link expectAddBicycleFlow}.
 *
 * - (a) The bicycle's card opens its details, with no components.
 * - (b) Saving an empty component is rejected and focuses the type.
 * - (c) The corrected component is saved and listed.
 *
 * @param page - Page showing the home screen with only the "Gravel Grinder" bicycle.
 * @example
 * await expectIncludeComponentFlow(page);
 */
export async function expectIncludeComponentFlow(page: Page): Promise<void> {
  // (a) Details.
  await page.getByRole('list', { name: 'Bicycles' }).getByRole('button').click();
  await expect(page.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeVisible();
  await expect(page.getByText('No components on this bicycle yet.')).toBeVisible();

  // (b) Rejected.
  const include = page.getByRole('button', { name: 'Include component' });
  await include.click();
  const dialog = page.getByRole('dialog', { name: 'Include component' });
  await dialog.getByRole('button', { name: 'Include' }).click();
  await expect(dialog.getByRole('combobox', { name: 'Type' })).toBeFocused();
  await expect(dialog.getByRole('textbox', { name: 'Model' })).toHaveAttribute('aria-invalid', 'true');

  // (c) Saved.
  await dialog.getByRole('combobox', { name: 'Type' }).selectOption('Chain');
  await dialog.getByRole('textbox', { name: 'Model' }).fill('Shimano CN-M8100');
  await dialog.getByRole('button', { name: 'Include' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(include).toBeFocused();
  await expect(page.getByRole('list', { name: 'In use' }).getByRole('listitem')).toHaveText([
    /Chain.*Shimano CN-M8100/,
  ]);
}

/**
 * Asserts that the data from {@link expectAddBicycleFlow} and {@link expectIncludeComponentFlow} was restored. Run it
 * after the app restarted.
 *
 * - (a) The app starts on the home screen, not on the details screen that was open, and lists the bicycle.
 * - (b) The bicycle's details still list its component.
 *
 * @param page - Page showing the restarted app.
 * @example
 * await page.reload();
 * await expectRestoredBicycle(page);
 */
export async function expectRestoredBicycle(page: Page): Promise<void> {
  // (a) Home.
  const card = page.getByRole('list', { name: 'Bicycles' }).getByRole('button');
  await expect(card).toHaveText([/Gravel Grinder/]);

  // (b) Details.
  await card.click();
  await expect(page.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'In use' }).getByRole('listitem')).toHaveText([
    /Chain.*Shimano CN-M8100/,
  ]);
}

/**
 * The worked example's rows in use after its third step, in the bicycle's order. Chain A was last cleaned at 1500 km of
 * its own distance, so 1,400 km of riding count since its care.
 */
const WORKED_EXAMPLE_IN_USE = [
  /^Cassette.*CS-M8100.*Distance4,500 km.*Since installed4,500 km/,
  // One literal is too long for a line; the parts are joined with `.*`.
  new RegExp(
    [
      /^Chain.*KMC X12.*LabelA.*Distance2,900 km.*Since installed1,400 km/.source,
      /LubricantWax.*Stretch0\.2 of 0\.5 %/.source,
      /Since lubrication1,400 of 300 km, limit reached.*Since cleaning1,400 of 1,500 km/.source,
    ].join('.*'),
  ),
];

/** The worked example's resting rows after its third step. */
const WORKED_EXAMPLE_RESTING = [/^Chain.*KMC X12.*LabelB.*Distance1,600 km/, /^Chain.*KMC X12.*LabelC.*Distance0 km/];

/**
 * Adds a labelled chain to the "Gravel Grinder" bicycle from the "Add component" form, leaving "In use now" at its
 * default (on while the bicycle has no chain in use). The form opens the bicycle's details after the save.
 *
 * @param page - Page showing the app with the menu closed.
 * @param label - The chain's label.
 */
async function addChain(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Main menu' }).getByRole('button', { name: 'Add component' }).click();
  const main = page.getByRole('main');
  await main.getByRole('combobox', { name: 'Type' }).selectOption('Chain');
  await main.getByRole('textbox', { name: 'Model' }).fill('KMC X12');
  await main.getByRole('textbox', { name: 'Label' }).fill(label);
  await main.getByRole('combobox', { name: 'Bicycle' }).selectOption('Gravel Grinder');
  await main.getByRole('button', { name: 'Save component' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeVisible();
}

/**
 * Sets the shown bicycle's total from the update distance dialog.
 *
 * @param page - Page showing the bicycle's details.
 * @param total - The new total in kilometres.
 */
async function setTotal(page: Page, total: string): Promise<void> {
  await page.getByRole('button', { name: 'Update distance' }).click();
  const dialog = page.getByRole('dialog', { name: 'Update distance' });
  await dialog.getByRole('textbox', { name: 'Total distance' }).fill(total);
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toHaveCount(0);
}

/**
 * Puts a resting chain in use from its **Use now** dialog, in place of the chain in use (preselected), and checks that
 * focus moved to its row.
 *
 * @param page - Page showing the bicycle's details.
 * @param label - The chain's label.
 * @param odometer - The reading at the swap, or `undefined` to keep the current odometer.
 */
async function useChain(page: Page, label: string, odometer?: string): Promise<void> {
  await page.getByRole('button', { name: `Use now: Chain KMC X12 (${label})` }).click();
  const dialog = page.getByRole('dialog', { name: 'Put component in use' });
  await expect(dialog.getByRole('combobox', { name: 'Replaces' })).toHaveValue(/.+/);

  if (odometer !== undefined) {
    await dialog.getByRole('textbox', { name: 'Odometer' }).fill(odometer);
  }

  await dialog.getByRole('button', { name: 'Use now', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('list', { name: 'In use' }).getByRole('listitem').filter({ hasText: `Label${label}` }),
  ).toBeFocused();
}

/** What a care entry records, as the log care dialog offers it. */
interface CareStep {
  /** The option of "What was done". */
  action: 'Topped up' | 'Cleaned and relubricated' | 'Measured only';
  /** The lubricant to choose, or `undefined` to keep the preset one. */
  lubricant?: 'Oil' | 'Wax';
  /** The odometer at the care, or `undefined` to keep the current odometer. */
  odometer?: string;
  /** The measured stretch in percent, or `undefined` for none. */
  stretch?: string;
}

/**
 * Logs care on chain A, in use, from its **Log care** dialog, and checks that focus returned to the button.
 *
 * @param page - Page showing the bicycle's details.
 * @param step - What was done.
 */
async function logCareOnChainA(page: Page, { action, lubricant, odometer, stretch }: CareStep): Promise<void> {
  const button = page.getByRole('button', { name: 'Log care: Chain KMC X12 (A)' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Log chain care' });
  await dialog.getByRole('radio', { name: action }).check();

  if (lubricant !== undefined) {
    await dialog.getByRole('combobox', { name: 'Lubricant' }).selectOption(lubricant);
  }

  if (odometer !== undefined) {
    await dialog.getByRole('textbox', { name: 'Odometer' }).fill(odometer);
  }

  if (stretch !== undefined) {
    await dialog.getByRole('textbox', { name: 'Stretch' }).fill(stretch);
  }

  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
}

/**
 * Asserts chain A's distances since its care.
 *
 * @param page - Page showing the bicycle's details with chain A in use.
 * @param lubrication - The expected "Since lubrication" text.
 * @param cleaning - The expected "Since cleaning" text.
 */
async function expectChainACare(page: Page, lubrication: string, cleaning: string): Promise<void> {
  const row = page.getByRole('list', { name: 'In use' }).getByRole('listitem').filter({ hasText: 'LabelA' });
  await expect(row).toContainText(`Since lubrication${lubrication}`);
  await expect(row).toContainText(`Since cleaning${cleaning}`);
}

/**
 * Asserts the worked example's distances after its third step (`tickets/plan.md`, Worked example).
 *
 * @param page - Page showing the "Gravel Grinder" details.
 */
async function expectWorkedExampleDistances(page: Page): Promise<void> {
  await expect(page.getByRole('list', { name: 'In use' }).getByRole('listitem')).toHaveText(WORKED_EXAMPLE_IN_USE);
  await expect(page.getByRole('list', { name: 'Resting' }).getByRole('listitem')).toHaveText(WORKED_EXAMPLE_RESTING);
}

/**
 * The first three usage steps and the chain care steps of the worked example (`tickets/plan.md`), entered through the UI. Run it right after
 * {@link expectAddBicycleFlow}.
 *
 * - (a) A cassette is included, and chains A, B, and C are added from the form: A starts in use, B and C rest, and no
 *   notice shows.
 * - (b) Chain care over the first 1500 km: cleaned and waxed at 0, odometer 300 (300 / 300 km since lubrication /
 *   cleaning); odometer 550, then a wax top-up entered late, at 300 (250 / 550); odometer 1500, cleaned and waxed with a
 *   stretch of 0.2 % (0 / 0).
 * - (c) Swap A → B at 1500; odometer 3100.
 * - (d) Odometer 4500; swap B → A entered late, at 3100: A 2,900 km (1,400 since installed), B 1,600, C 0, and the
 *   cassette 4,500; chain A 1,400 km since its last care.
 *
 * @param page - Page showing the home screen with only the "Gravel Grinder" bicycle, at 0 km.
 * @example
 * await expectAddBicycleFlow(page);
 * await expectWorkedExampleFlow(page);
 */
export async function expectWorkedExampleFlow(page: Page): Promise<void> {
  // (a) Setup.
  await page.getByRole('list', { name: 'Bicycles' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Include component' }).click();
  const include = page.getByRole('dialog', { name: 'Include component' });
  await include.getByRole('combobox', { name: 'Type' }).selectOption('Cassette');
  await include.getByRole('textbox', { name: 'Model' }).fill('CS-M8100');
  await include.getByRole('button', { name: 'Include' }).click();
  await expect(include).toHaveCount(0);
  for (const label of ['A', 'B', 'C']) {
    await addChain(page, label);
  }
  await expect(page.getByRole('list', { name: 'Resting' }).getByRole('listitem')).toHaveCount(2);
  await expect(page.getByRole('alert')).toHaveCount(0);

  // (b) Chain care.
  await logCareOnChainA(page, { action: 'Cleaned and relubricated', lubricant: 'Wax' });
  await setTotal(page, '300');
  await expectChainACare(page, '300 of 300 km, limit reached', '300 of 1,500 km');
  await setTotal(page, '550');
  await logCareOnChainA(page, { action: 'Topped up', odometer: '300' });
  await expectChainACare(page, '250 of 300 km', '550 of 1,500 km');
  await setTotal(page, '1500');
  await logCareOnChainA(page, { action: 'Cleaned and relubricated', stretch: '0.2' });
  await expectChainACare(page, '0 of 300 km', '0 of 1,500 km');

  // (c) First swap, on time.
  await useChain(page, 'B');
  await setTotal(page, '3100');

  // (d) Second swap, entered late.
  await setTotal(page, '4500');
  await useChain(page, 'A', '3100');
  await expectWorkedExampleDistances(page);
}

/**
 * Asserts that the worked example from {@link expectWorkedExampleFlow} was restored. Run it after the app restarted.
 *
 * @param page - Page showing the restarted app.
 * @example
 * await expectRestoredWorkedExample(page);
 */
export async function expectRestoredWorkedExample(page: Page): Promise<void> {
  await page.getByRole('list', { name: 'Bicycles' }).getByRole('button').click();
  await expect(page.getByRole('heading', { level: 2, name: 'Gravel Grinder' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Distance' }).getByText('4,500 km')).toBeVisible();
  await expectWorkedExampleDistances(page);
}
