import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  createTask: vi.fn(),
  createTaskCompletion: vi.fn(),
  getFamilyBoardSourceData: vi.fn(),
  getFamilyPerson: vi.fn(),
  getFamilyTask: vi.fn(),
  removeTaskCompletion: vi.fn(),
}));

const streakServiceMocks = vi.hoisted(() => ({
  getFamilyBoardStreaks: vi.fn(),
  syncFamilyCurrentStreaks: vi.fn(),
}));

vi.mock('@/db/family-board-repository', () => ({
  createTask: repositoryMocks.createTask,
  createTaskCompletion: repositoryMocks.createTaskCompletion,
  getFamilyBoardSourceData: repositoryMocks.getFamilyBoardSourceData,
  getFamilyPerson: repositoryMocks.getFamilyPerson,
  getFamilyTask: repositoryMocks.getFamilyTask,
  removeTaskCompletion: repositoryMocks.removeTaskCompletion,
}));

vi.mock('@/services/streak', () => ({
  getFamilyBoardStreaks: streakServiceMocks.getFamilyBoardStreaks,
  syncFamilyCurrentStreaks: streakServiceMocks.syncFamilyCurrentStreaks,
}));

import {
  FamilyBoardStateError,
  getFamilyBoardState,
  toggleTaskCompletion,
} from '@/services/family-board-service';

const task = {
  id: 'task-kitchen',
  family_id: 'family-maple',
  person_id: 'person-jess',
  title: 'Kitchen reset',
  emoji: '🍽️',
  schedule_rules: {
    days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
  },
  created_at: '2026-04-01T08:00:00Z',
} as const;

describe('family-board-service mutations', () => {
  beforeEach(() => {
    repositoryMocks.createTask.mockReset();
    repositoryMocks.createTaskCompletion.mockReset();
    repositoryMocks.getFamilyBoardSourceData.mockReset();
    repositoryMocks.getFamilyPerson.mockReset();
    repositoryMocks.getFamilyTask.mockReset();
    repositoryMocks.removeTaskCompletion.mockReset();
    streakServiceMocks.getFamilyBoardStreaks.mockReset();
    streakServiceMocks.syncFamilyCurrentStreaks.mockReset();
  });

  it('recalculates persisted streak rows after a completion is created', async () => {
    repositoryMocks.getFamilyTask.mockResolvedValue(task);

    await toggleTaskCompletion({} as never, {
      familyId: task.family_id,
      taskId: task.id,
      date: '2026-04-08',
      completed: true,
      completedAt: '2026-04-08T12:00:00Z',
    });

    expect(repositoryMocks.createTaskCompletion).toHaveBeenCalledWith(
      {},
      {
        taskId: task.id,
        date: '2026-04-08',
        completedAt: '2026-04-08T12:00:00Z',
      },
    );
    expect(streakServiceMocks.syncFamilyCurrentStreaks).toHaveBeenCalledWith(
      {},
      task.family_id,
      { force: true },
    );
  });

  it('recalculates persisted streak rows after a completion is removed', async () => {
    repositoryMocks.getFamilyTask.mockResolvedValue(task);

    await toggleTaskCompletion({} as never, {
      familyId: task.family_id,
      taskId: task.id,
      date: '2026-04-08',
      completed: false,
    });

    expect(repositoryMocks.removeTaskCompletion).toHaveBeenCalledWith(
      {},
      task.id,
      '2026-04-08',
    );
    expect(streakServiceMocks.syncFamilyCurrentStreaks).toHaveBeenCalledWith(
      {},
      task.family_id,
      { force: true },
    );
  });

  it('overrides source streak rows with the service-calculated board streaks', async () => {
    repositoryMocks.getFamilyBoardSourceData.mockResolvedValue({
      persons: [
        {
          id: 'person-jess',
          family_id: task.family_id,
          name: 'Jess',
          display_order: 0,
          emoji: '🌿',
        },
      ],
      tasks: [task],
      completions: [],
      skipDay: null,
    });
    streakServiceMocks.getFamilyBoardStreaks.mockResolvedValue([
      {
        person_id: 'person-jess',
        current_count: 4,
        best_count: 7,
        last_qualifying_date: '2026-04-07',
      },
    ]);

    const state = await getFamilyBoardState(
      {} as never,
      task.family_id,
      '2026-04-08',
    );

    expect(state.people[0]?.streak.current_count).toBe(4);
    expect(streakServiceMocks.getFamilyBoardStreaks).toHaveBeenCalledWith(
      {},
      task.family_id,
      '2026-04-08',
    );
  });

  it('rejects toggles for tasks that are not scheduled on the requested day', async () => {
    repositoryMocks.getFamilyTask.mockResolvedValue({
      ...task,
      schedule_rules: {
        days: ['MO'],
      },
    });

    await expect(
      toggleTaskCompletion({} as never, {
        familyId: task.family_id,
        taskId: task.id,
        date: '2026-04-08',
        completed: true,
      }),
    ).rejects.toThrow(FamilyBoardStateError);

    expect(streakServiceMocks.syncFamilyCurrentStreaks).not.toHaveBeenCalled();
  });
});
