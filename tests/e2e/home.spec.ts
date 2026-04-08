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

  const dayLabel = page.getByTestId('day-label');
  const initialDayLabel = await dayLabel.textContent();

  await page.getByTestId('day-nav-previous').click();

  await expect(page).toHaveURL(/day=/);
  await expect(dayLabel).not.toHaveText(initialDayLabel ?? '');

  await page.getByRole('link', { name: "Open Jess's list" }).click();

  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add task' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jess' })).toBeVisible();
  await expect(page).toHaveURL(/people\/[^/?]+\?day=/);
  const progressText = page.getByText(
    /^[01] of 1 tasks marked for this day\.$/,
  );
  await expect(progressText).toBeVisible();
  const initialProgress = await progressText.textContent();

  await page.getByRole('button', { name: 'Toggle Kitchen reset' }).click();

  await expect(progressText).not.toHaveText(initialProgress ?? '');

  await page.getByRole('link', { name: 'Back' }).click();

  await expect(page).toHaveURL(/day=/);
  await expect(page.getByTestId('person-column')).toHaveCount(6);

  await page.getByTestId('day-nav-next').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(dayLabel).toHaveText(initialDayLabel ?? '');

  await page.getByTestId('day-nav-next').click();
  await expect(page).toHaveURL(/day=/);
  await expect(page.getByTestId('day-nav-next')).toBeDisabled();
});
