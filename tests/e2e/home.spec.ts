import { expect, test } from '@playwright/test';

test('renders the realtime household dashboard with seeded family data', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/');

  await expect(
    page.getByRole('heading', {
      name: 'WeDo',
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByTestId('person-column')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Jess' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cora' })).toBeVisible();
  await expect(page.getByText('Kitchen reset')).toBeVisible();
  await expect(page.getByText('Laundry reset')).toBeVisible();
  await expect(page.getByText('Vacuum')).toBeVisible();
  await expect(page.getByText('Morning chores')).toBeVisible();
});
