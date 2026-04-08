import { getIsoDateForTimezone } from '@/config/timezone';
import {
  getRuntimeConfig,
  type RuntimeConfigBindings,
  type WorkerBindings,
} from '@/config/runtime';
import { getPrimaryFamilyId } from '@/db/board-repository';
import { boardResponseSchema, type BoardResponse, type Timezone } from '@/types';

type BoardServiceBindings = Pick<WorkerBindings, 'DB'> & RuntimeConfigBindings;

export class BoardBootstrapError extends Error {}

export function getTodayForTimezone(
  timezone: Timezone,
  now: Date = new Date(),
) {
  try {
    return getIsoDateForTimezone(timezone, now);
  } catch (error) {
    throw new BoardBootstrapError(
      error instanceof Error
        ? error.message
        : `Unable to derive a board date for timezone ${timezone}.`,
    );
  }
}

export async function getBoardResponse(
  bindings: BoardServiceBindings,
  now: Date = new Date(),
): Promise<BoardResponse> {
  const runtime = getRuntimeConfig(bindings);
  const familyId = await getPrimaryFamilyId(bindings.DB);

  if (!familyId) {
    throw new BoardBootstrapError(
      'No family is available to bootstrap the dashboard.',
    );
  }

  return boardResponseSchema.parse({
    board: {
      familyId,
      householdName: runtime.householdName,
      date: getTodayForTimezone(runtime.timezone, now),
    },
  });
}
