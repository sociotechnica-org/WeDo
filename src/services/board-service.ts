import { getIsoDateForTimezone } from '@/config/timezone';
import {
  getRuntimeConfig,
  type RuntimeConfigBindings,
  type WorkerBindings,
} from '@/config/runtime';
import { getPrimaryFamilyId } from '@/db/board-repository';
import {
  addDaysToIsoDate,
  boardResponseSchema,
  compareIsoDates,
  type BoardResponse,
  type IsoDate,
  type Timezone,
} from '@/types';

type BoardServiceBindings = Pick<WorkerBindings, 'DB'> & RuntimeConfigBindings;
type BoardResponseOptions = {
  now?: Date;
  requestedDate?: IsoDate;
};

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

export function resolveBoardDate(
  timezone: Timezone,
  requestedDate?: IsoDate,
  now: Date = new Date(),
): IsoDate {
  const todayDate = getTodayForTimezone(timezone, now);

  if (!requestedDate) {
    return todayDate;
  }

  const tomorrowDate = addDaysToIsoDate(todayDate, 1);

  if (compareIsoDates(requestedDate, tomorrowDate) > 0) {
    return tomorrowDate;
  }

  return requestedDate;
}

export async function getBoardResponse(
  bindings: BoardServiceBindings,
  options: BoardResponseOptions = {},
): Promise<BoardResponse> {
  const runtime = getRuntimeConfig(bindings);
  const now = options.now ?? new Date();
  const familyId = await getPrimaryFamilyId(bindings.DB);
  const todayDate = getTodayForTimezone(runtime.timezone, now);

  if (!familyId) {
    throw new BoardBootstrapError(
      'No family is available to bootstrap the dashboard.',
    );
  }

  return boardResponseSchema.parse({
    board: {
      familyId,
      householdName: runtime.householdName,
      date: resolveBoardDate(
        runtime.timezone,
        options.requestedDate,
        now,
      ),
      todayDate,
    },
  });
}
