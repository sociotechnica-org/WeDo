import { useOutletContext } from 'react-router-dom';
import type { ReadyFamilyBoardState } from '@/ui/hooks/family-board-state';
import type { ReadyFamilyBoardViewState } from '@/ui/hooks/use-family-board';

export function useReadyBoard() {
  return useOutletContext<ReadyFamilyBoardViewState>();
}

export function useReadyBoardSnapshot() {
  return useOutletContext<ReadyFamilyBoardState>();
}
