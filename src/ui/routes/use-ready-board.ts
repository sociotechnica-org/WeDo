import { useOutletContext } from 'react-router-dom';
import type { ReadyFamilyBoardViewState } from '@/ui/hooks/use-family-board';

export function useReadyBoard() {
  return useOutletContext<ReadyFamilyBoardViewState>();
}
