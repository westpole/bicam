import { expect, test } from '@playwright/test';

/** Mobile web (portrait and landscape projects): the app shell renders the project name. */
test.describe('web app shell', () => {
  test('shows the project name as heading and document title', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
    await expect(page).toHaveTitle('Bicam');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('loads without console errors or CSP violations', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('fits the viewport without horizontal scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('caches the detected language', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toMatch(/^en/);
  });
});

test.describe('unsupported browser language', () => {
  test.use({ locale: 'de-DE' });

  test('falls back to English translations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'Bicam' })).toBeVisible();
  });
});
