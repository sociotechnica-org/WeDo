import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personSchema, taskCompletionSchema, taskSchema } from '@/types';

const repositoryMocks = vi.hoisted(() => ({
  getFamilyPersistedStreaks: vi.fn(),
  getFamilyStreakCalculationSource: vi.fn(),
  savePersistedStreaks: vi.fn(),
}));

vi.mock('@/db/streak-repository', () => ({
  getFamilyPersistedStreaks: repositoryMocks.getFamilyPersistedStreaks,
  getFamilyStreakCalculationSource:
    repositoryMocks.getFamilyStreakCalculationSource,
  savePersistedStreaks: repositoryMocks.savePersistedStreaks,
}));

import { syncFamilyCurrentStreaks } from '@/services/streak';

const familyId = 'family-maple';
const todayDate = '2026-04-08';
const person = personSchema.parse({
  id: 'person-jess',
  family_id: familyId,
  name: 'Jess',
  display_order: 0,
  emoji: '🌿',
});
const task = taskSchema.parse({
  id: 'task-kitchen',
  family_id: familyId,
  person_id: person.id,
  title: 'Kitchen reset',
  emoji: '🍽️',
  schedule_rules: {
    days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
  },
  created_at: '2026-04-01T08:00:00Z',
});
const completion = taskCompletionSchema.parse({
  id: 'completion-2026-04-08',
  task_id: task.id,
  date: todayDate,
  completed_at: '2026-04-08T12:00:00Z',
});

describe('streak sync service', () => {
  beforeEach(() => {
    repositoryMocks.getFamilyPersistedStreaks.mockReset();
    repositoryMocks.getFamilyStreakCalculationSource.mockReset();
    repositoryMocks.savePersistedStreaks.mockReset();
  });

  it('skips recalculation when persisted streaks are already evaluated through today', async () => {
    repositoryMocks.getFamilyPersistedStreaks.mockResolvedValue([
      {
        person_id: person.id,
        current_count: 2,
        best_count: 2,
        last_qualifying_date: '2026-04-07',
        evaluated_through_date: todayDate,
      },
    ]);

    await syncFamilyCurrentStreaks({} as never, familyId, { todayDate });

    expect(
      repositoryMocks.getFamilyStreakCalculationSource,
    ).not.toHaveBeenCalled();
    expect(repositoryMocks.savePersistedStreaks).not.toHaveBeenCalled();
  });

  it('recalculates same-day streak rows when forced after a task toggle', async () => {
    repositoryMocks.getFamilyPersistedStreaks.mockResolvedValue([
      {
        person_id: person.id,
        current_count: 0,
        best_count: 0,
        last_qualifying_date: null,
        evaluated_through_date: todayDate,
      },
    ]);
    repositoryMocks.getFamilyStreakCalculationSource.mockResolvedValue({
      familyId,
      persons: [person],
      tasks: [task],
      completions: [completion],
      skipDayDates: [],
    });

    await syncFamilyCurrentStreaks({} as never, familyId, {
      todayDate,
      force: true,
    });

    expect(
      repositoryMocks.getFamilyStreakCalculationSource,
    ).toHaveBeenCalledWith({}, familyId, todayDate);
    expect(repositoryMocks.savePersistedStreaks).toHaveBeenCalledWith({}, [
      {
        person_id: person.id,
        current_count: 1,
        best_count: 1,
        last_qualifying_date: todayDate,
        evaluated_through_date: todayDate,
      },
    ]);
  });
});
