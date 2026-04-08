import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  createSkipDay: vi.fn(),
  createTask: vi.fn(),
  createTaskCompletion: vi.fn(),
  getFamilyBoardSourceData: vi.fn(),
  getFamilyPerson: vi.fn(),
  getFamilyTask: vi.fn(),
  removeSkipDay: vi.fn(),
  removeTaskCompletion: vi.fn(),
  removeTaskWithCompletions: vi.fn(),
}));

const streakServiceMocks = vi.hoisted(() => ({
  getFamilyBoardStreaks: vi.fn(),
  syncFamilyCurrentStreaks: vi.fn(),
}));

vi.mock('@/db/family-board-repository', () => ({
  createSkipDay: repositoryMocks.createSkipDay,
  createTask: repositoryMocks.createTask,
  createTaskCompletion: repositoryMocks.createTaskCompletion,
  getFamilyBoardSourceData: repositoryMocks.getFamilyBoardSourceData,
  getFamilyPerson: repositoryMocks.getFamilyPerson,
  getFamilyTask: repositoryMocks.getFamilyTask,
  removeSkipDay: repositoryMocks.removeSkipDay,
  removeTaskCompletion: repositoryMocks.removeTaskCompletion,
  removeTaskWithCompletions: repositoryMocks.removeTaskWithCompletions,
}));

vi.mock('@/services/streak', () => ({
  getFamilyBoardStreaks: streakServiceMocks.getFamilyBoardStreaks,
  syncFamilyCurrentStreaks: streakServiceMocks.syncFamilyCurrentStreaks,
}));

import {
  deleteTask,
  FamilyBoardStateError,
  getFamilyBoardState,
  toggleSkipDay,
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
    repositoryMocks.createSkipDay.mockReset();
    repositoryMocks.createTask.mockReset();
    repositoryMocks.createTaskCompletion.mockReset();
    repositoryMocks.getFamilyBoardSourceData.mockReset();
    repositoryMocks.getFamilyPerson.mockReset();
    repositoryMocks.getFamilyTask.mockReset();
    repositoryMocks.removeSkipDay.mockReset();
    repositoryMocks.removeTaskCompletion.mockReset();
    repositoryMocks.removeTaskWithCompletions.mockReset();
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

  it('creates a family skip day and recalculates persisted streak rows', async () => {
    await toggleSkipDay({} as never, {
      familyId: task.family_id,
      date: '2026-04-08',
      skipped: true,
      createdAt: '2026-04-08T14:00:00Z',
    });

    expect(repositoryMocks.createSkipDay).toHaveBeenCalledWith(
      {},
      {
        familyId: task.family_id,
        date: '2026-04-08',
        createdAt: '2026-04-08T14:00:00Z',
      },
    );
    expect(streakServiceMocks.syncFamilyCurrentStreaks).toHaveBeenCalledWith(
      {},
      task.family_id,
      { force: true },
    );
  });

  it('removes a family skip day and recalculates persisted streak rows', async () => {
    await toggleSkipDay({} as never, {
      familyId: task.family_id,
      date: '2026-04-08',
      skipped: false,
    });

    expect(repositoryMocks.removeSkipDay).toHaveBeenCalledWith(
      {},
      task.family_id,
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

  it('deletes a family task, clears its completions, and recalculates streak rows', async () => {
    repositoryMocks.getFamilyTask.mockResolvedValue(task);

    await deleteTask({} as never, {
      familyId: task.family_id,
      taskId: task.id,
    });

    expect(repositoryMocks.removeTaskWithCompletions).toHaveBeenCalledWith(
      {},
      task.family_id,
      task.id,
    );
    expect(streakServiceMocks.syncFamilyCurrentStreaks).toHaveBeenCalledWith(
      {},
      task.family_id,
      { force: true },
    );
  });

  it('rejects task deletion when the task is outside the family scope', async () => {
    repositoryMocks.getFamilyTask.mockResolvedValue(null);

    await expect(
      deleteTask({} as never, {
        familyId: task.family_id,
        taskId: task.id,
      }),
    ).rejects.toThrow(FamilyBoardStateError);

    expect(repositoryMocks.removeTaskWithCompletions).not.toHaveBeenCalled();
    expect(streakServiceMocks.syncFamilyCurrentStreaks).not.toHaveBeenCalled();
  });
});
