import { test, expect } from '@playwright/test';
test('creator publishes a draft into the public video catalog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByRole('textbox', { name: 'Display name' }).fill('Publisher');
  await page.getByRole('textbox', { name: 'Email' }).fill(`creator-${Date.now()}@example.test`);
  await page.getByLabel('Password').fill('long-demo-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('button', { name: 'Creator Studio' }).click();
  await page.getByRole('textbox', { name: 'Video title' }).fill('My original space lesson');
  await page.getByRole('textbox', { name: 'Description' }).fill('A synthetic creator tutorial');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await page.getByRole('button', { name: 'Publish video' }).click();
  await page.getByRole('button', { name: 'StreamForge home' }).click();
  await page.getByRole('searchbox', { name: 'Search videos' }).fill('My original space lesson');
  await expect(page.getByRole('button', { name: 'Watch My original space lesson' })).toBeVisible();
});
