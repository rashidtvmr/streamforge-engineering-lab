import { expect, test } from '@playwright/test';
test('search suggestions use the backend and update discovery', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Search videos' }).fill('React');
  await page.getByRole('button', { name: 'Suggested: React rendering at scale' }).click();
  await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
});
