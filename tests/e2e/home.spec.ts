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
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
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

  await page.getByRole('link', { name: "Open Jess's list" }).click();
  await page.getByRole('button', { name: 'Toggle Kitchen reset' }).click();
  await page.getByRole('link', { name: 'Back' }).click();

  const jessColumn = page.getByTestId('person-column').filter({
    has: page.getByRole('heading', { name: 'Jess' }),
  });
  await expect(jessColumn.getByText('1 day streak')).toBeVisible();

  await page.getByTestId('day-nav-next').click();
  await expect(page).toHaveURL(/day=/);
  await expect(page.getByTestId('day-nav-next')).toBeDisabled();
});

test('creates a task from natural language in the focused single-list view', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/');
  await page.getByRole('link', { name: "Open Jess's list" }).click();

  await page.route('**/api/families/*/tasks', async (route) => {
    const requestBody = route.request().postDataJSON() as {
      person_id: string;
      raw_input: string;
      viewed_date: string;
    };

    expect(requestBody.raw_input).toBe('practice piano every day');

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        task: {
          id: 'task-new-piano',
          family_id: '2b95f346-f41d-4c78-8ec6-bd37ec0117b4',
          person_id: requestBody.person_id,
          title: 'Practice piano',
          emoji: '🎹',
          schedule_rules: {
            days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
          },
          created_at: '2026-04-08T12:00:00Z',
        },
        state: {
          family_id: '2b95f346-f41d-4c78-8ec6-bd37ec0117b4',
          day: {
            date: requestBody.viewed_date,
            is_sunday: false,
          },
          people: [
            {
              person: {
                id: requestBody.person_id,
                family_id: '2b95f346-f41d-4c78-8ec6-bd37ec0117b4',
                name: 'Jess',
                display_order: 0,
                emoji: '🌿',
              },
              streak: {
                person_id: requestBody.person_id,
                current_count: 0,
                best_count: 0,
                last_qualifying_date: null,
              },
              skip_day: null,
              tasks: [
                {
                  task: {
                    id: '8b7c6fc3-1fe3-4e85-a76e-49f15fca5fd8',
                    family_id: '2b95f346-f41d-4c78-8ec6-bd37ec0117b4',
                    person_id: requestBody.person_id,
                    title: 'Kitchen reset',
                    emoji: '🍽️',
                    schedule_rules: {
                      days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                    },
                    created_at: '2026-04-08T00:00:00Z',
                  },
                  completion: null,
                },
                {
                  task: {
                    id: 'task-new-piano',
                    family_id: '2b95f346-f41d-4c78-8ec6-bd37ec0117b4',
                    person_id: requestBody.person_id,
                    title: 'Practice piano',
                    emoji: '🎹',
                    schedule_rules: {
                      days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
                    },
                    created_at: '2026-04-08T12:00:00Z',
                  },
                  completion: null,
                },
              ],
            },
          ],
        },
      }),
    });
  });

  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByLabel('Add task').fill('practice piano every day');
  await page.getByRole('button', { name: 'Create task' }).click();

  await expect(
    page.getByText('Task added to the recurring schedule.'),
  ).toBeVisible();
  await expect(page.getByText('Practice piano')).toBeVisible();
  await expect(
    page.getByText('0 of 2 tasks marked for this day.'),
  ).toBeVisible();
});

test('saves person settings, reorders columns, adds a person, and removes a person', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Settings' }).click();

  await expect(
    page.getByRole('heading', { name: 'Person management' }),
  ).toBeVisible();
  await expect(page.getByTestId('settings-person-row')).toHaveCount(6);

  const elizabethRow = page
    .getByTestId('settings-person-row')
    .filter({ has: page.locator('input[value="Elizabeth"]') });
  await elizabethRow.getByRole('button', { name: 'Move Elizabeth up' }).click();

  await page.getByPlaceholder('🌼').fill('🪁');
  await page.getByPlaceholder('New Person').fill('Ada');
  await page.getByRole('button', { name: 'Add Person' }).click();

  const wellsRow = page
    .getByTestId('settings-person-row')
    .filter({ has: page.locator('input[value="Wells"]') });
  await wellsRow.getByRole('button', { name: 'Remove' }).click();
  await wellsRow.getByRole('button', { name: 'Confirm remove' }).click();

  await page.getByRole('button', { name: 'Save settings' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByTestId('person-column')).toHaveCount(6);
  await expect(
    page.getByTestId('person-column').first().getByRole('heading', {
      name: 'Elizabeth',
    }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wells' })).toHaveCount(0);
});

test('toggles the current day into a skipped, dimmed state and can clear it again', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/');

  const skipToggle = page.getByTestId('day-skip-toggle');
  const dayLabel = page.getByTestId('day-label');
  const firstColumn = page.getByTestId('person-column').first();

  await expect(skipToggle).toHaveText('SKIP TODAY');
  await skipToggle.click();

  await expect(skipToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(dayLabel).toHaveAttribute('data-skipped', 'true');
  await expect(firstColumn).toHaveAttribute('data-skipped', 'true');

  await page.reload();

  await expect(skipToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(dayLabel).toHaveAttribute('data-skipped', 'true');

  await skipToggle.click();

  await expect(skipToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(dayLabel).toHaveAttribute('data-skipped', 'false');
  await expect(firstColumn).toHaveAttribute('data-skipped', 'false');
});

test('deletes a task from the focused single-list view and removes it from the dashboard', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/');
  await page.getByRole('link', { name: "Open Jess's list" }).click();

  const taskToggle = page.getByRole('button', { name: 'Toggle Kitchen reset' });
  await taskToggle.hover();

  const deleteButton = page.getByRole('button', {
    name: 'Delete Kitchen reset',
  });

  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  await expect(page.getByText('Kitchen reset')).toHaveCount(0);
  await expect(page.getByText('No tasks for this day.')).toBeVisible();
  await expect(
    page.getByText('0 of 0 tasks marked for this day.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Back' }).click();

  await expect(page.getByText('Kitchen reset')).toHaveCount(0);
});
