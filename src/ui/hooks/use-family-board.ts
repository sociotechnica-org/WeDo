import { useCallback, useEffect, useRef, useState } from 'react';
import {
  boardResponseSchema,
  createTaskResponseSchema,
  serverWebSocketMessageSchema,
  type BoardResponse,
  type InitRequest,
  type IsoDate,
  type SkipDayToggledMessage,
  type TaskDeletedMessage,
  type ServerWebSocketMessage,
  type TaskToggledMessage,
} from '@/types';
import {
  findTaskCompletionStatus,
  findBoardSkipDay,
  getRealtimeCloseMessage,
  getRealtimeErrorMessage,
  isReadyBoardViewFor,
  type ReadyFamilyBoardState,
  type FamilyBoardViewState,
  withBoardSnapshot,
  createReadyFamilyBoardState,
  withOptimisticTaskToggle,
  withOptimisticTaskDeletion,
  withOptimisticSkipDay,
  withRecoveredRealtimeIssue,
  withRealtimeIssue,
} from './family-board-state';

function buildSocketUrl(familyId: string): URL {
  const url = new URL(`/api/realtime/${familyId}`, window.location.origin);

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url;
}

function buildBoardUrl(requestedDay?: IsoDate): string {
  const url = new URL('/api/board', window.location.origin);

  if (requestedDay) {
    url.searchParams.set('day', requestedDay);
  }

  return url.toString();
}

function buildCreateTaskUrl(familyId: string): string {
  return new URL(
    `/api/families/${familyId}/tasks`,
    window.location.origin,
  ).toString();
}

async function getMessageText(
  data: ArrayBuffer | Blob | string,
): Promise<string> {
  if (typeof data === 'string') {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  return await data.text();
}

export function useFamilyBoard(requestedDay?: IsoDate) {
  const [state, setState] = useState<FamilyBoardViewState>({
    status: 'loading',
  });
  const socketRef = useRef<WebSocket | null>(null);
  const stateRef = useRef<FamilyBoardViewState>(state);
  const confirmedStateRef = useRef<ReadyFamilyBoardState | null>(null);

  // Keep the ref and React state in sync so async socket callbacks always
  // reconcile against the latest board snapshot.
  const commitState = useCallback((nextState: FamilyBoardViewState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const toggleTask = useCallback(
    (taskId: string): boolean => {
      const currentState = stateRef.current;

      if (currentState.status !== 'ready') {
        return false;
      }

      const currentCompletion = findTaskCompletionStatus(
        currentState.board,
        taskId,
      );

      if (currentCompletion === null) {
        return false;
      }

      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        commitState(
          withRealtimeIssue(
            currentState,
            'The board is still visible, but live updates are paused.',
          ),
        );

        return false;
      }

      const completedAt = new Date().toISOString();
      const optimisticState = withOptimisticTaskToggle(
        currentState,
        taskId,
        completedAt,
      );

      if (!optimisticState) {
        return false;
      }

      const message = {
        type: 'task_toggled',
        date: currentState.board.day.date,
        task_id: taskId,
        completed: !currentCompletion,
      } satisfies TaskToggledMessage;

      commitState(optimisticState);

      try {
        socket.send(JSON.stringify(message));
        return true;
      } catch {
        commitState(
          withRealtimeIssue(
            currentState,
            'The board is still visible, but live updates are paused.',
          ),
        );
        return false;
      }
    },
    [commitState],
  );

  const toggleSkipDay = useCallback((): boolean => {
    const currentState = stateRef.current;

    if (currentState.status !== 'ready') {
      return false;
    }

    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      commitState(
        withRealtimeIssue(
          currentState,
          'The board is still visible, but live updates are paused.',
        ),
      );

      return false;
    }

    const createdAt = new Date().toISOString();
    const nextSkipped = findBoardSkipDay(currentState.board) === null;
    const optimisticState = withOptimisticSkipDay(
      currentState,
      nextSkipped,
      createdAt,
    );
    const message = {
      type: 'skip_day_toggled',
      date: currentState.board.day.date,
      skipped: nextSkipped,
    } satisfies SkipDayToggledMessage;

    commitState(optimisticState);

    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch {
      commitState(
        withRealtimeIssue(
          currentState,
          'The board is still visible, but live updates are paused.',
        ),
      );
      return false;
    }
  }, [commitState]);

  const deleteTask = useCallback(
    (taskId: string): boolean => {
      const currentState = stateRef.current;

      if (currentState.status !== 'ready') {
        return false;
      }

      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        commitState(
          withRealtimeIssue(
            currentState,
            'The board is still visible, but live updates are paused.',
          ),
        );

        return false;
      }

      const optimisticState = withOptimisticTaskDeletion(currentState, taskId);

      if (!optimisticState) {
        return false;
      }

      const message = {
        type: 'task_deleted',
        task_id: taskId,
      } satisfies TaskDeletedMessage;

      commitState(optimisticState);

      try {
        socket.send(JSON.stringify(message));
        return true;
      } catch {
        commitState(
          withRealtimeIssue(
            currentState,
            'The board is still visible, but live updates are paused.',
          ),
        );
        return false;
      }
    },
    [commitState],
  );

  const createTask = useCallback(
    async (personId: string, rawInput: string): Promise<void> => {
      const currentState = stateRef.current;

      if (currentState.status !== 'ready') {
        throw new Error('The board is not ready for task entry.');
      }

      const requestFamilyId = currentState.board.family_id;
      const requestViewedDate = currentState.board.day.date;

      try {
        const response = await fetch(buildCreateTaskUrl(requestFamilyId), {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            person_id: personId,
            raw_input: rawInput,
            viewed_date: requestViewedDate,
          }),
        });

        if (!response.ok) {
          const message =
            (await response.text()) || 'Task creation failed unexpectedly.';

          if (
            !isReadyBoardViewFor(
              stateRef.current,
              requestFamilyId,
              requestViewedDate,
            )
          ) {
            return;
          }

          throw new Error(message);
        }

        const payload = createTaskResponseSchema.parse(
          (await response.json()) as unknown,
        );
        const latestState = stateRef.current;

        if (
          !isReadyBoardViewFor(latestState, requestFamilyId, requestViewedDate)
        ) {
          return;
        }

        commitState(withBoardSnapshot(latestState, payload.state));
      } catch (error) {
        if (
          !isReadyBoardViewFor(
            stateRef.current,
            requestFamilyId,
            requestViewedDate,
          )
        ) {
          return;
        }

        throw error;
      }
    },
    [commitState],
  );

  useEffect(() => {
    // Changing the requested day should rebuild the board snapshot against a
    // fresh bootstrap + socket initialization for that exact date.
    const controller = new AbortController();
    let isDisposed = false;
    let hasInitialized = false;

    confirmedStateRef.current = null;
    commitState({
      status: 'loading',
    });

    async function connect() {
      try {
        const bootstrapResponse = await fetch(buildBoardUrl(requestedDay), {
          signal: controller.signal,
        });

        if (!bootstrapResponse.ok) {
          throw new Error(
            `Dashboard bootstrap failed with ${bootstrapResponse.status}.`,
          );
        }

        const bootstrap = boardResponseSchema.parse(
          (await bootstrapResponse.json()) as BoardResponse,
        );

        if (isDisposed) {
          return;
        }

        const socket = new WebSocket(
          buildSocketUrl(bootstrap.board.familyId).toString(),
        );

        socketRef.current = socket;

        socket.addEventListener('open', () => {
          const initMessage = {
            type: 'init',
            date: bootstrap.board.date,
          } satisfies InitRequest;

          socket.send(JSON.stringify(initMessage));
        });

        socket.addEventListener('message', (event) => {
          void (async () => {
            try {
              const payload = serverWebSocketMessageSchema.parse(
                JSON.parse(
                  await getMessageText(
                    event.data as ArrayBuffer | Blob | string,
                  ),
                ) as ServerWebSocketMessage,
              );

              hasInitialized = true;

              if (isDisposed) {
                return;
              }

              const confirmedState = createReadyFamilyBoardState(
                payload.state,
                bootstrap.board.householdName,
                bootstrap.board.todayDate,
              );

              confirmedStateRef.current = confirmedState;
              commitState(confirmedState);
            } catch (error) {
              if (isDisposed) {
                return;
              }

              const message =
                error instanceof Error
                  ? error.message
                  : 'Unexpected realtime payload.';

              if (hasInitialized) {
                commitState(withRealtimeIssue(stateRef.current, message));
                return;
              }

              commitState({
                status: 'error',
                message,
              });
            }
          })();
        });

        socket.addEventListener('error', () => {
          if (isDisposed) {
            return;
          }

          const message = getRealtimeErrorMessage(hasInitialized);

          if (hasInitialized) {
            commitState(withRealtimeIssue(stateRef.current, message));
            return;
          }

          commitState({
            status: 'error',
            message,
          });
        });

        socket.addEventListener('close', (event) => {
          if (isDisposed) {
            return;
          }

          const message = getRealtimeCloseMessage(event.reason, hasInitialized);

          if (socketRef.current === socket) {
            socketRef.current = null;
          }

          if (hasInitialized) {
            commitState(
              event.code === 1008
                ? withRecoveredRealtimeIssue(
                    stateRef.current,
                    confirmedStateRef.current,
                    message,
                  )
                : withRealtimeIssue(stateRef.current, message),
            );
            return;
          }

          commitState({
            status: 'error',
            message,
          });
        });
      } catch (error) {
        if (controller.signal.aborted || isDisposed) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unknown board loading error.';

        commitState({
          status: 'error',
          message,
        });
      }
    }

    void connect();

    return () => {
      isDisposed = true;
      controller.abort();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [commitState, requestedDay]);

  if (state.status !== 'ready') {
    return state;
  }

  return {
    ...state,
    createTask,
    deleteTask,
    toggleSkipDay,
    toggleTask,
  };
}

type ToggleTask = (taskId: string) => boolean;
type DeleteTask = (taskId: string) => boolean;
type ToggleSkipDay = () => boolean;
type CreateTask = (personId: string, rawInput: string) => Promise<void>;

export type ReadyFamilyBoardViewState = ReadyFamilyBoardState & {
  createTask: CreateTask;
  deleteTask: DeleteTask;
  toggleSkipDay: ToggleSkipDay;
  toggleTask: ToggleTask;
};
