import { useCallback, useEffect, useRef, useState } from 'react';
import {
  boardResponseSchema,
  createTaskResponseSchema,
  serverWebSocketMessageSchema,
  type BoardResponse,
  type InitRequest,
  type IsoDate,
  type ServerWebSocketMessage,
  type TaskToggledMessage,
} from '@/types';
import {
  createReadyFamilyBoardState,
  findTaskCompletionStatus,
  getRealtimeCloseMessage,
  getRealtimeErrorMessage,
  type ReadyFamilyBoardState,
  type FamilyBoardViewState,
  withOptimisticTaskToggle,
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
  return new URL(`/api/families/${familyId}/tasks`, window.location.origin)
    .toString();
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

  const createTask = useCallback(
    async (personId: string, rawInput: string): Promise<void> => {
      const currentState = stateRef.current;

      if (currentState.status !== 'ready') {
        throw new Error('The board is not ready for task entry.');
      }

      const response = await fetch(
        buildCreateTaskUrl(currentState.board.family_id),
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            person_id: personId,
            raw_input: rawInput,
            viewed_date: currentState.board.day.date,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          (await response.text()) || 'Task creation failed unexpectedly.',
        );
      }

      const payload = createTaskResponseSchema.parse(
        (await response.json()) as unknown,
      );

      commitState(
        createReadyFamilyBoardState(
          payload.state,
          currentState.householdName,
          currentState.todayDate,
        ),
      );
    },
    [commitState],
  );

  useEffect(() => {
    // Changing the requested day should rebuild the board snapshot against a
    // fresh bootstrap + socket initialization for that exact date.
    const controller = new AbortController();
    let isDisposed = false;
    let hasInitialized = false;

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

              commitState(
                createReadyFamilyBoardState(
                  payload.state,
                  bootstrap.board.householdName,
                  bootstrap.board.todayDate,
                ),
              );
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
            commitState(withRealtimeIssue(stateRef.current, message));
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
  }, [commitState, requestedDay, toggleTask]);

  if (state.status !== 'ready') {
    return state;
  }

  return {
    ...state,
    createTask,
    toggleTask,
  };
}

type ToggleTask = (taskId: string) => boolean;
type CreateTask = (personId: string, rawInput: string) => Promise<void>;

export type ReadyFamilyBoardViewState = ReadyFamilyBoardState & {
  createTask: CreateTask;
  toggleTask: ToggleTask;
};
