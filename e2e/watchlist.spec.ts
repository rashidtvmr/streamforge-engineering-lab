import { expect, test } from '@playwright/test';

test.describe('saved videos across browser reloads', () => {
  test('saves a video, reloads, then removes it from the collection', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Save React rendering at scale to watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Remove React rendering at scale from watchlist' })).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await page.getByRole('button', { name: 'Saved videos' }).click();
    await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove React rendering at scale from watchlist' }).click();
    await expect(page.getByRole('heading', { name: 'Your watchlist is empty' })).toBeVisible();
  });

  test('makes the saved collection usable on a narrow phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Save React rendering at scale to watchlist' }).click();
    await page.getByRole('button', { name: 'Open saved videos' }).click();
    await expect(page.getByRole('heading', { name: 'Saved videos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
  });
});
