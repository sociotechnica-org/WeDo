import type {
  FamilyBoardState,
  IsoDate,
  SkipDay,
  TaskCompletion,
} from '@/types';

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

export function isReadyBoardViewFor(
  currentState: FamilyBoardViewState,
  familyId: string,
  date: IsoDate,
): currentState is ReadyFamilyBoardState {
  return (
    currentState.status === 'ready' &&
    currentState.board.family_id === familyId &&
    currentState.board.day.date === date
  );
}

export function withBoardSnapshot(
  currentState: ReadyFamilyBoardState,
  board: FamilyBoardState,
): ReadyFamilyBoardState {
  return {
    ...currentState,
    board,
  };
}

function createOptimisticSkipDay(
  board: FamilyBoardState,
  createdAt: string,
): SkipDay {
  return {
    id: `optimistic:skip-day:${board.day.date}`,
    family_id: board.family_id,
    date: board.day.date,
    reason: null,
    created_at: createdAt,
  };
}

export function findBoardSkipDay(board: FamilyBoardState): SkipDay | null {
  return (
    board.people.find((personState) => personState.skip_day !== null)
      ?.skip_day ?? null
  );
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

export function deleteTaskInBoard(
  board: FamilyBoardState,
  taskId: string,
): FamilyBoardState | null {
  let hasUpdated = false;

  const people = board.people.map((personState) => {
    const tasks = personState.tasks.filter((task) => {
      if (task.task.id !== taskId) {
        return true;
      }

      hasUpdated = true;
      return false;
    });

    if (tasks.length === personState.tasks.length) {
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

export function toggleSkipDayInBoard(
  board: FamilyBoardState,
  skipped: boolean,
  createdAt: string,
): FamilyBoardState {
  const skipDay = skipped ? createOptimisticSkipDay(board, createdAt) : null;

  return {
    ...board,
    people: board.people.map((personState) => ({
      ...personState,
      skip_day: skipDay,
    })),
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

export function withOptimisticSkipDay(
  currentState: ReadyFamilyBoardState,
  skipped: boolean,
  createdAt: string,
): ReadyFamilyBoardState {
  return {
    ...currentState,
    board: toggleSkipDayInBoard(currentState.board, skipped, createdAt),
  };
}

export function withOptimisticTaskDeletion(
  currentState: ReadyFamilyBoardState,
  taskId: string,
): ReadyFamilyBoardState | null {
  const board = deleteTaskInBoard(currentState.board, taskId);

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

export function withRecoveredRealtimeIssue(
  currentState: FamilyBoardViewState,
  confirmedState: ReadyFamilyBoardState | null,
  message: string,
): FamilyBoardViewState {
  if (confirmedState === null) {
    return withRealtimeIssue(currentState, message);
  }

  return {
    ...confirmedState,
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
