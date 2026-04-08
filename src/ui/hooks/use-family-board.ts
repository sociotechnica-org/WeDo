import { useEffect, useState } from 'react';
import {
  boardResponseSchema,
  serverWebSocketMessageSchema,
  type BoardResponse,
  type FamilyBoardState,
  type InitRequest,
  type ServerWebSocketMessage,
} from '@/types';

type FamilyBoardStateState =
  | { status: 'loading' }
  | {
      status: 'ready';
      board: FamilyBoardState;
      householdName: string;
    }
  | { status: 'error'; message: string };

function buildSocketUrl(familyId: string): URL {
  const url = new URL(`/api/realtime/${familyId}`, window.location.origin);

  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

  return url;
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

export function useFamilyBoard() {
  const [state, setState] = useState<FamilyBoardStateState>({
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    let socket: WebSocket | undefined;
    let isDisposed = false;
    let hasInitialized = false;

    async function connect() {
      try {
        const bootstrapResponse = await fetch('/api/board', {
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

        socket = new WebSocket(buildSocketUrl(bootstrap.board.familyId).toString());

        socket.addEventListener('open', () => {
          const initMessage = {
            type: 'init',
            date: bootstrap.board.date,
          } satisfies InitRequest;

          socket?.send(JSON.stringify(initMessage));
        });

        socket.addEventListener('message', (event) => {
          void (async () => {
            try {
              const payload = serverWebSocketMessageSchema.parse(
                JSON.parse(
                  await getMessageText(event.data as ArrayBuffer | Blob | string),
                ) as ServerWebSocketMessage,
              );

              hasInitialized = true;

              if (isDisposed) {
                return;
              }

              setState({
                status: 'ready',
                board: payload.state,
                householdName: bootstrap.board.householdName,
              });
            } catch (error) {
              if (isDisposed || hasInitialized) {
                return;
              }

              const message =
                error instanceof Error
                  ? error.message
                  : 'Unexpected realtime payload.';

              setState({
                status: 'error',
                message,
              });
            }
          })();
        });

        socket.addEventListener('close', (event) => {
          if (isDisposed || hasInitialized) {
            return;
          }

          setState({
            status: 'error',
            message:
              event.reason || 'Realtime connection closed before the board loaded.',
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

        setState({
          status: 'error',
          message,
        });
      }
    }

    void connect();

    return () => {
      isDisposed = true;
      controller.abort();
      socket?.close();
    };
  }, []);

  return state;
}
