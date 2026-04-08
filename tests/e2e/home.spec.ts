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

  await page.getByRole('link', { name: "Open Jess's list" }).click();

  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jess' })).toBeVisible();
  const progressText = page.getByText(/^[01] of 1 tasks done today\.$/);
  await expect(progressText).toBeVisible();
  const initialProgress = await progressText.textContent();

  await page.getByRole('button', { name: 'Toggle Kitchen reset' }).click();

  await expect(progressText).not.toHaveText(initialProgress ?? '');

  await page.getByRole('link', { name: 'Back' }).click();

  await expect(page.getByTestId('person-column')).toHaveCount(6);
});
