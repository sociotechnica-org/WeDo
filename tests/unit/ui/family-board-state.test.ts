import { describe, expect, it } from 'vitest';
import { familyBoardStateSchema } from '@/types';
import {
  createReadyFamilyBoardState,
  findBoardSkipDay,
  findTaskCompletionStatus,
  getRealtimeCloseMessage,
  getRealtimeErrorMessage,
  isReadyBoardViewFor,
  toggleSkipDayInBoard,
  toggleTaskCompletionInBoard,
  withBoardSnapshot,
  withOptimisticSkipDay,
  withOptimisticTaskToggle,
  withRealtimeIssue,
} from '@/ui/hooks/family-board-state';

const board = familyBoardStateSchema.parse({
  family_id: 'family-maple',
  day: {
    date: '2026-04-08',
    is_sunday: false,
  },
  people: [
    {
      person: {
        id: 'person-jess',
        family_id: 'family-maple',
        name: 'Jess',
        display_order: 0,
        emoji: '🌿',
      },
      streak: {
        person_id: 'person-jess',
        current_count: 3,
        best_count: 7,
        last_qualifying_date: '2026-04-07',
      },
      skip_day: null,
      tasks: [
        {
          task: {
            id: 'task-kitchen',
            family_id: 'family-maple',
            person_id: 'person-jess',
            title: 'Kitchen reset',
            emoji: '🍽️',
            schedule_rules: {
              days: ['MO', 'TU', 'WE', 'TH', 'FR'],
            },
            created_at: '2026-04-08T00:00:00Z',
          },
          completion: null,
        },
      ],
    },
  ],
});

describe('family-board-state helpers', () => {
  const todayDate = '2026-04-08' as const;

  it('creates a live ready state from the latest board snapshot', () => {
    expect(
      createReadyFamilyBoardState(board, 'River House', todayDate),
    ).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      todayDate,
      realtime: {
        status: 'live',
      },
    });
  });

  it('preserves the last good board while marking realtime as degraded', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
    );

    expect(
      withRealtimeIssue(
        readyState,
        'The board is still visible, but live updates are paused.',
      ),
    ).toEqual({
      status: 'ready',
      board,
      householdName: 'River House',
      todayDate,
      realtime: {
        status: 'degraded',
        message: 'The board is still visible, but live updates are paused.',
      },
    });
  });

  it('replaces the board snapshot without resetting the latest realtime state', () => {
    const degradedState = withRealtimeIssue(
      createReadyFamilyBoardState(board, 'River House', todayDate),
      'The board is still visible, but live updates are paused.',
    );
    const nextBoard = familyBoardStateSchema.parse({
      ...board,
      people: [
        {
          ...board.people[0],
          tasks: [
            ...board.people[0]!.tasks,
            {
              task: {
                id: 'task-piano',
                family_id: 'family-maple',
                person_id: 'person-jess',
                title: 'Practice piano',
                emoji: '🎹',
                schedule_rules: {
                  days: ['MO', 'TU', 'TH', 'FR'],
                },
                created_at: '2026-04-08T12:00:00Z',
              },
              completion: null,
            },
          ],
        },
      ],
    });

    expect(degradedState.status).toBe('ready');

    if (degradedState.status !== 'ready') {
      throw new Error('Expected a ready state.');
    }

    expect(withBoardSnapshot(degradedState, nextBoard)).toEqual({
      ...degradedState,
      board: nextBoard,
    });
  });

  it('matches only the ready state for the same family and viewed day', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
    );

    expect(isReadyBoardViewFor(readyState, 'family-maple', '2026-04-08')).toBe(
      true,
    );
    expect(isReadyBoardViewFor(readyState, 'family-maple', '2026-04-09')).toBe(
      false,
    );
    expect(
      isReadyBoardViewFor(
        {
          status: 'loading',
        },
        'family-maple',
        '2026-04-08',
      ),
    ).toBe(false);
  });

  it('applies an optimistic completion toggle to the current board snapshot', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
    );
    const completedAt = '2026-04-08T12:00:00Z';
    const optimisticState = withOptimisticTaskToggle(
      readyState,
      'task-kitchen',
      completedAt,
    );

    expect(optimisticState?.board.people[0]?.tasks[0]?.completion).toEqual({
      id: 'optimistic:2026-04-08:task-kitchen',
      task_id: 'task-kitchen',
      date: '2026-04-08',
      completed_at: completedAt,
    });
    expect(
      findTaskCompletionStatus(optimisticState!.board, 'task-kitchen'),
    ).toBe(true);
  });

  it('returns null when an optimistic toggle targets a missing task', () => {
    expect(
      toggleTaskCompletionInBoard(
        board,
        'task-missing',
        '2026-04-08T12:00:00Z',
      ),
    ).toBeNull();
    expect(findTaskCompletionStatus(board, 'task-missing')).toBeNull();
  });

  it('applies an optimistic skip day to every person on the current board snapshot', () => {
    const readyState = createReadyFamilyBoardState(
      board,
      'River House',
      todayDate,
    );
    const optimisticState = withOptimisticSkipDay(
      readyState,
      true,
      '2026-04-08T14:00:00Z',
    );

    expect(findBoardSkipDay(optimisticState.board)).toEqual({
      id: 'optimistic:skip-day:2026-04-08',
      family_id: 'family-maple',
      date: '2026-04-08',
      reason: null,
      created_at: '2026-04-08T14:00:00Z',
    });
  });

  it('clears an optimistic skip day from every person on the current board snapshot', () => {
    const skippedBoard = toggleSkipDayInBoard(
      board,
      true,
      '2026-04-08T14:00:00Z',
    );

    expect(
      findBoardSkipDay(toggleSkipDayInBoard(skippedBoard, false, 'unused')),
    ).toBeNull();
  });

  it('returns initialization-aware websocket failure copy', () => {
    expect(getRealtimeErrorMessage(false)).toBe(
      'Realtime connection failed before the board loaded.',
    );
    expect(getRealtimeErrorMessage(true)).toBe(
      'The board is still visible, but live updates may be unavailable.',
    );
    expect(getRealtimeCloseMessage('', false)).toBe(
      'Realtime connection closed before the board loaded.',
    );
    expect(getRealtimeCloseMessage('', true)).toBe(
      'The board is still visible, but live updates are paused.',
    );
    expect(getRealtimeCloseMessage('Socket closed by server.', true)).toBe(
      'Socket closed by server.',
    );
  });
});
