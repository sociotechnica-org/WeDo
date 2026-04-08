import { useOutletContext } from 'react-router-dom';
import type { ReadyFamilyBoardState } from '@/ui/hooks/family-board-state';
import type { ReadyFamilyBoardViewState } from '@/ui/hooks/use-family-board';

function useReadyBoardContext() {
  return useOutletContext<ReadyFamilyBoardViewState>();
}

export function useReadyBoard() {
  return useReadyBoardContext();
}

export function useReadyBoardSnapshot(): ReadyFamilyBoardState {
  const { board, householdName, realtime, status, todayDate } =
    useReadyBoardContext();

  return {
    board,
    householdName,
    realtime,
    status,
    todayDate,
  };
}
