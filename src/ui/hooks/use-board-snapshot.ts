import { useEffect, useState } from 'react';
import {
  boardResponseSchema,
  type BoardResponse,
  type BoardSnapshot,
} from '@/types/board';

type BoardSnapshotState =
  | { status: 'loading' }
  | { status: 'ready'; board: BoardSnapshot }
  | { status: 'error'; message: string };

export function useBoardSnapshot() {
  const [state, setState] = useState<BoardSnapshotState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function loadBoard() {
      try {
        const response = await fetch('/api/board', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Board request failed with ${response.status}.`);
        }

        const payload = boardResponseSchema.parse(
          (await response.json()) as BoardResponse,
        );

        setState({
          status: 'ready',
          board: payload.board,
        });
      } catch (error) {
        if (controller.signal.aborted) {
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

    void loadBoard();

    return () => {
      controller.abort();
    };
  }, []);

  return state;
}
