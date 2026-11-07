import { expect, test } from '@playwright/test';

test('register, persist authenticated session, sign out', async ({ page }) => {
  const email = `student-${Date.now()}-${Math.round(Math.random() * 9999)}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByRole('textbox', { name: 'Display name' }).fill('Student');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByLabel('Password').fill('sufficiently-long-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Student' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Student' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to StreamForge' })).toBeVisible();
});
