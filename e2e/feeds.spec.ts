import { expect, test } from '@playwright/test';
test('trending and personalized discovery navigate to playable content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Trending' }).click();
  await expect(page.getByRole('heading', { name: 'Trending videos' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Trending videos' }).getByRole('article').first()).toBeVisible();
  await page.getByRole('button', { name: 'For you' }).click();
  await expect(page.getByRole('heading', { name: 'For you' })).toBeVisible();
});
