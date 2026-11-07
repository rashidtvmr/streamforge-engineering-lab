import { test, expect } from '@playwright/test';
test('signed-in watch history persists when revisiting the library', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByRole('textbox', { name: 'Display name' }).fill('History Tester');
  await page.getByRole('textbox', { name: 'Email' }).fill(`history-${Date.now()}@example.test`);
  await page.getByLabel('Password').fill('strong-demo-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.getByRole('button', { name: 'StreamForge home' }).click();
  await page.getByRole('button', { name: 'Watch React rendering at scale' }).click();
  await page.getByRole('button', { name: '← Back to discovery' }).click();
  await page.getByRole('button', { name: 'Watch history' }).click();
  await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear watch history' }).click();
  await expect(page.getByText('Your watch history is empty.')).toBeVisible();
});
