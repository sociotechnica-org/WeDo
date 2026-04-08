import type { FamilyBoardState, IsoDate, TaskCompletion } from '@/types';

type RealtimeState =
  | { status: 'live' }
  | {
      status: 'degraded';
      message: string;
    };

export type ReadyFamilyBoardState = {
  status: 'ready';
  board: FamilyBoardState;
  householdName: string;
  todayDate: IsoDate;
  realtime: RealtimeState;
};

export type FamilyBoardViewState =
  | { status: 'loading' }
  | ReadyFamilyBoardState
  | { status: 'error'; message: string };

export function createReadyFamilyBoardState(
  board: FamilyBoardState,
  householdName: string,
  todayDate: IsoDate,
): ReadyFamilyBoardState {
  return {
    status: 'ready',
    board,
    householdName,
    todayDate,
    realtime: {
      status: 'live',
    },
  };
}

function createOptimisticCompletion(
  board: FamilyBoardState,
  taskId: string,
  completedAt: string,
): TaskCompletion {
  return {
    id: `optimistic:${board.day.date}:${taskId}`,
    task_id: taskId,
    date: board.day.date,
    completed_at: completedAt,
  };
}

export function findTaskCompletionStatus(
  board: FamilyBoardState,
  taskId: string,
): boolean | null {
  for (const personState of board.people) {
    for (const task of personState.tasks) {
      if (task.task.id === taskId) {
        return task.completion !== null;
      }
    }
  }

  return null;
}

export function toggleTaskCompletionInBoard(
  board: FamilyBoardState,
  taskId: string,
  completedAt: string,
): FamilyBoardState | null {
  let hasUpdated = false;

  const people = board.people.map((personState) => {
    let hasTaskUpdate = false;

    const tasks = personState.tasks.map((task) => {
      if (task.task.id !== taskId) {
        return task;
      }

      hasUpdated = true;
      hasTaskUpdate = true;

      return {
        ...task,
        completion:
          task.completion === null
            ? createOptimisticCompletion(board, taskId, completedAt)
            : null,
      };
    });

    if (!hasTaskUpdate) {
      return personState;
    }

    return {
      ...personState,
      tasks,
    };
  });

  if (!hasUpdated) {
    return null;
  }

  return {
    ...board,
    people,
  };
}

export function withOptimisticTaskToggle(
  currentState: ReadyFamilyBoardState,
  taskId: string,
  completedAt: string,
): ReadyFamilyBoardState | null {
  const board = toggleTaskCompletionInBoard(
    currentState.board,
    taskId,
    completedAt,
  );

  if (!board) {
    return null;
  }

  return {
    ...currentState,
    board,
  };
}

export function withRealtimeIssue(
  currentState: FamilyBoardViewState,
  message: string,
): FamilyBoardViewState {
  if (currentState.status !== 'ready') {
    return currentState;
  }

  return {
    ...currentState,
    realtime: {
      status: 'degraded',
      message,
    },
  };
}

export function getRealtimeErrorMessage(hasInitialized: boolean) {
  return hasInitialized
    ? 'The board is still visible, but live updates may be unavailable.'
    : 'Realtime connection failed before the board loaded.';
}

export function getRealtimeCloseMessage(
  reason: string,
  hasInitialized: boolean,
) {
  if (reason) {
    return reason;
  }

  return hasInitialized
    ? 'The board is still visible, but live updates are paused.'
    : 'Realtime connection closed before the board loaded.';
}
