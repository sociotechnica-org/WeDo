import { beforeEach, describe, expect, it, vi } from 'vitest';

const databaseMocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
}));

vi.mock('@/db/database', () => ({
  getDatabase: databaseMocks.getDatabase,
}));

import {
  getFamilyStreakCalculationSource,
  savePersistedStreaks,
} from '@/db/streak-repository';

function createSelectChain<T>(
  result: T,
  terminal: 'where' | 'orderBy' | 'limit',
) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() =>
      terminal === 'where' ? Promise.resolve(result) : chain,
    ),
    orderBy: vi.fn(() =>
      terminal === 'orderBy' ? Promise.resolve(result) : chain,
    ),
    limit: vi.fn(() =>
      terminal === 'limit' ? Promise.resolve(result) : chain,
    ),
  };

  return chain;
}

describe('streak-repository', () => {
  beforeEach(() => {
    databaseMocks.getDatabase.mockReset();
  });

  it('validates skip day dates loaded for streak calculation', async () => {
    const db = {
      select: vi
        .fn()
        .mockReturnValueOnce(
          createSelectChain(
            [
              {
                id: 'person-jess',
                family_id: 'family-maple',
                name: 'Jess',
                display_order: 0,
                emoji: '🌿',
              },
            ],
            'orderBy',
          ),
        )
        .mockReturnValueOnce(
          createSelectChain(
            [
              {
                id: 'task-kitchen',
                family_id: 'family-maple',
                person_id: 'person-jess',
                title: 'Kitchen reset',
                emoji: '🍽️',
                schedule_rules: { days: ['MO', 'TU', 'WE', 'TH', 'FR'] },
                created_at: '2026-04-01T08:00:00Z',
              },
            ],
            'orderBy',
          ),
        )
        .mockReturnValueOnce(createSelectChain([], 'where'))
        .mockReturnValueOnce(
          createSelectChain([{ date: 'not-a-date' }], 'orderBy'),
        ),
    };
    databaseMocks.getDatabase.mockReturnValue(db as never);

    await expect(
      getFamilyStreakCalculationSource(
        {} as never,
        'family-maple',
        '2026-04-08',
      ),
    ).rejects.toThrow();
  });

  it('batches persisted streak upserts into a single insert', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({
      onConflictDoUpdate,
    }));
    const insert = vi.fn(() => ({
      values,
    }));
    databaseMocks.getDatabase.mockReturnValue({
      insert,
    } as never);

    await savePersistedStreaks({} as never, [
      {
        person_id: 'person-jess',
        current_count: 2,
        best_count: 4,
        last_qualifying_date: '2026-04-07',
        evaluated_through_date: '2026-04-08',
      },
      {
        person_id: 'person-micah',
        current_count: 1,
        best_count: 3,
        last_qualifying_date: '2026-04-08',
        evaluated_through_date: '2026-04-08',
      },
    ]);

    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });
});
