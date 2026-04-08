import { getRuntimeConfig, type RuntimeConfigBindings } from '@/config/runtime';
import { getScaffoldBoardSnapshot } from '@/db/board-repository';
import { boardResponseSchema, type BoardResponse, type BoardSnapshot } from '@/types';

export function getBoardSnapshot(bindings: RuntimeConfigBindings): BoardSnapshot {
  const runtimeConfig = getRuntimeConfig(bindings);

  return getScaffoldBoardSnapshot(runtimeConfig.householdName);
}

export function getBoardResponse(bindings: RuntimeConfigBindings): BoardResponse {
  return boardResponseSchema.parse({
    board: getBoardSnapshot(bindings),
  });
}
