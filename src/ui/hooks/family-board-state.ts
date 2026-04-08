import type { FamilyBoardState } from '@/types';

type RealtimeState =
  | { status: 'live' }
  | {
      status: 'degraded';
      message: string;
    };

export type FamilyBoardViewState =
  | { status: 'loading' }
  | {
      status: 'ready';
      board: FamilyBoardState;
      householdName: string;
      realtime: RealtimeState;
    }
  | { status: 'error'; message: string };

export function createReadyFamilyBoardState(
  board: FamilyBoardState,
  householdName: string,
): FamilyBoardViewState {
  return {
    status: 'ready',
    board,
    householdName,
    realtime: {
      status: 'live',
    },
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
