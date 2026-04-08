import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator } from '@playwright/test';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..', '..');

function getNpmExecutable() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function reseedLocalDatabase() {
  execFileSync(getNpmExecutable(), ['run', 'db:seed:local'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
}

async function readComputedStyles(locator: Locator) {
  return locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);

    return {
      backgroundColor: styles.backgroundColor,
      backgroundImage: styles.backgroundImage,
      boxShadow: styles.boxShadow,
      color: styles.color,
      fontWeight: styles.fontWeight,
    };
  });
}

test.beforeEach(() => {
  reseedLocalDatabase();
});

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
  const progressText = page.getByText(/0 of 1 task marked for this day\./);
  await expect(progressText).toBeVisible();
  expect(
    Number(
      (await readComputedStyles(page.getByRole('heading', { name: 'Jess' })))
        .fontWeight,
    ),
  ).toBeLessThanOrEqual(500);
  expect(
    Number((await readComputedStyles(progressText)).fontWeight),
  ).toBeLessThanOrEqual(500);

  await page.getByRole('button', { name: 'Toggle Kitchen reset' }).click();

  await expect(
    page.getByText(/1 of 1 task marked for this day\./),
  ).toBeVisible();

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
  const disabledNextArrow = page.getByTestId('day-nav-next');
  await expect(disabledNextArrow).toBeDisabled();

  const disabledNextArrowStyles = await readComputedStyles(disabledNextArrow);
  expect(disabledNextArrowStyles.backgroundImage).toBe('none');
  expect(disabledNextArrowStyles.backgroundColor).toBe(
    'rgba(245, 237, 227, 0.46)',
  );
  expect(disabledNextArrowStyles.color).toBe('rgba(123, 107, 92, 0.45)');
  expect(disabledNextArrowStyles.boxShadow).toMatch(/none|0px 0px 0px 0px/);
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

  await page.getByRole('button', { name: 'Add task' }).click();
  await page.getByLabel('Add task').fill('practice piano every day');
  await page.getByRole('button', { name: 'Create task' }).click();

  await expect(
    page.getByText('Task added to the recurring schedule.'),
  ).toBeVisible();
  await expect(page.getByText('Practice piano')).toBeVisible();
  await expect(
    page.getByText(/0 of 2 tasks marked for this day\./),
  ).toBeVisible();

  await page.reload();

  await expect(page.getByText('Practice piano')).toBeVisible();
  await expect(
    page.getByText(/0 of 2 tasks marked for this day\./),
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

  await expect
    .poll(async () => (await readComputedStyles(skipToggle)).backgroundColor)
    .toBe('rgba(177, 201, 220, 0.28)');

  const pressedSkipStyles = await readComputedStyles(skipToggle);
  expect(pressedSkipStyles.backgroundImage).toBe('none');

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
    page.getByText('No tasks resting on this page today.'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Back' }).click();

  await expect(page.getByText('Kitchen reset')).toHaveCount(0);
});

test('renders the watercolor prototype route at an iPad-sized landscape viewport', async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1180,
    height: 820,
  });

  await page.goto('/prototype/watercolor');

  await expect(
    page.getByRole('heading', { name: 'Household art, not software' }),
  ).toBeVisible();
  await expect(page.getByText('PROTO-001 watercolor study')).toBeVisible();
  await expect(page.getByText('Storybook script')).toBeVisible();
  await expect(page.getByText('Letterpress serif')).toBeVisible();
  await expect(page.getByText('Field notes')).toBeVisible();
  await expect(page.getByTestId('prototype-type-study')).toHaveCount(3);
  await expect(page.getByTestId('prototype-person-column')).toHaveCount(6);
  await expect(
    page.getByTestId('watercolor-prototype-dashboard').getByText('Kitchen reset'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to dashboard' }),
  ).toBeVisible();

  const prototypeSurface = page.getByTestId('watercolor-prototype');
  const prototypeStyles = await readComputedStyles(prototypeSurface);
  expect(prototypeStyles.backgroundImage).not.toBe('none');
});
