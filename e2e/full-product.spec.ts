import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

/** Full browser journey against the actual Node/SQLite service, not mocked fetch. */
test('creator uploads and publishes; viewer actions persist across features', async ({ page, request }) => {
  const lesson = `Systems lesson ${randomUUID().slice(0, 8)}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Account', exact: true }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByRole('textbox', { name: 'Display name' }).fill('Full Journey Publisher');
  await page.getByRole('textbox', { name: 'Email' }).fill(`creator-${randomUUID()}@example.test`);
  await page.getByLabel('Password').fill('demo-strong-account-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('heading', { name: 'Welcome, Full Journey Publisher' })).toBeVisible();

  await page.getByRole('button', { name: 'Playlists' }).click();
  await page.getByRole('textbox', { name: 'New playlist name' }).fill('Learning Path');
  await page.getByRole('button', { name: 'Create playlist' }).click();

  await page.getByRole('button', { name: 'Creator Studio' }).click();
  await page.getByRole('textbox', { name: 'Video title' }).fill(lesson);
  await page.getByRole('textbox', { name: 'Description' }).fill('Original synthetic creator lesson');
  await page.getByRole('button', { name: 'Create draft' }).click();
  // Input is a file input, so target by its accessible label rather than textbox role.
  await page.getByLabel(`Upload MP4 for ${lesson}`).setInputFiles({
    name: 'fixture.mp4', mimeType: 'video/mp4',
    buffer: Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(12)]),
  });
  await expect(page.getByText('Media uploaded')).toBeVisible();
  await page.getByRole('button', { name: 'Publish video' }).click();

  await page.getByRole('button', { name: 'StreamForge home' }).click();
  await page.getByRole('searchbox', { name: 'Search videos' }).fill(lesson);
  await page.getByRole('button', { name: `Watch ${lesson}` }).click();
  await expect(page.getByLabel(`Video player: ${lesson}`)).toBeVisible();
  await page.getByRole('button', { name: /Save video/ }).click();
  await page.getByRole('button', { name: 'Like · 0' }).click();
  await expect(page.getByRole('button', { name: 'Like · 1' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('textbox', { name: 'Your comment' }).fill('End-to-end integration works.');
  await page.getByRole('button', { name: 'Post comment' }).click();
  await expect(page.getByText('End-to-end integration works.')).toBeVisible();
  await page.getByRole('combobox', { name: 'Choose playlist' }).selectOption({ label: 'Learning Path' });
  await page.getByRole('button', { name: 'Add video' }).click();
  await expect(page.getByText('Added to playlist')).toBeVisible();

  await page.getByRole('button', { name: '← Back to discovery' }).click();
  await page.getByRole('button', { name: 'Playlists' }).click();
  await page.getByRole('button', { name: 'Learning Path' }).click();
  await expect(page.getByRole('button', { name: `Watch ${lesson}` })).toBeVisible();
  await page.getByRole('button', { name: 'Watch history' }).click();
  await expect(page.getByRole('button', { name: `Watch ${lesson}` })).toBeVisible();
  const health = await request.get('/api/v1/ping');
  expect(health.status()).toBe(200);
});

test('phone navigation exposes account, playlists and Creator Studio', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Open navigation' });
  await toggle.click();
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(nav.getByRole('button', { name: 'Creator Studio' })).toBeVisible();
  await nav.getByRole('button', { name: 'Creator Studio' }).click();
  await expect(page.getByRole('heading', { name: 'Creator Studio' })).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await nav.getByRole('button', { name: 'Playlists' }).click();
  await expect(page.getByRole('heading', { name: 'Playlists' })).toBeVisible();
  await toggle.click();
  await nav.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
});

test('cross-site account mutations are blocked by the API security boundary', async ({ request }) => {
  const result = await request.post('/api/v1/accounts', {
    headers: { origin: 'https://evil.example.invalid' },
    data: { email: 'attempt@example.test', name: 'Malicious', password: 'not-a-real-secret' },
  });
  expect(result.status()).toBe(403);
  expect(await result.json()).toEqual({ error: 'CROSS_ORIGIN_BLOCKED' });
});
