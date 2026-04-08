import { expect, test } from '@playwright/test';

test('renders the scaffolded household board', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'WeDo',
    }),
  ).toBeVisible();
  await expect(page.getByText('Maple House')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Alex' })).toBeVisible();
  await expect(page.getByText('Kitchen reset')).toBeVisible();
});
