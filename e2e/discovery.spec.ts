import { expect, test } from '@playwright/test';

test.describe('real browser discovery journeys', () => {
  test('searches, filters, and opens a watch view using the real API', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Discover videos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
    await page.getByRole('button', { name: 'Science' }).click();
    await expect(page.getByRole('button', { name: 'Watch The science of deep oceans' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search videos' }).fill('satellites');
    await page.getByRole('button', { name: 'Watch How satellites stay in orbit' }).click();
    await expect(page.getByRole('heading', { name: 'How satellites stay in orbit' })).toBeVisible();
    await expect(page.getByLabel('Video player: How satellites stay in orbit')).toBeVisible();
  });

  test('paginates without losing previous content and sorts safely', async ({ page }) => {
    await page.goto('/');
    const results = page.getByRole('region', { name: 'Video results' });
    await expect(results.locator('article')).toHaveCount(12);
    await page.getByRole('button', { name: 'Load more videos' }).click();
    await expect(results.locator('article')).toHaveCount(24);
    await page.getByRole('combobox', { name: 'Sort videos' }).selectOption('popular');
    await expect(results.locator('article')).toHaveCount(12);
  });

  test('shows a searchable empty state and recovers from API failure', async ({ page }) => {
    await page.route('**/api/videos?*', async (route) => {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    });
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('503');
    await page.unroute('**/api/videos?*');
    await page.getByRole('button', { name: 'Retry loading' }).click();
    await expect(page.getByRole('button', { name: 'Watch React rendering at scale' })).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search videos' }).fill('nothing-matches-this');
    await expect(page.getByRole('heading', { name: 'No videos found' })).toBeVisible();
  });

  test('protects the backend against oversized page requests', async ({ request }) => {
    const response = await request.get('/api/videos?pageSize=100000');
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'INVALID_QUERY' });
  });
});
