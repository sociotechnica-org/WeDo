import { getRuntimeConfig, type WorkerBindings } from '@/config/runtime';
import { getScaffoldBoardSnapshot } from '@/db/board-repository';
import { boardResponseSchema, type BoardResponse, type BoardSnapshot } from '@/types';

export function getBoardSnapshot(bindings: WorkerBindings): BoardSnapshot {
  const runtimeConfig = getRuntimeConfig(bindings);

  return getScaffoldBoardSnapshot(runtimeConfig.householdName);
}

export function getBoardResponse(bindings: WorkerBindings): BoardResponse {
  return boardResponseSchema.parse({
    board: getBoardSnapshot(bindings),
  });
}
