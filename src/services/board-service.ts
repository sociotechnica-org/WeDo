import {
  getRuntimeConfig,
  type RuntimeConfigBindings,
  type WorkerBindings,
} from '@/config/runtime';
import { getPrimaryFamilyId } from '@/db/board-repository';
import { boardResponseSchema, isoDateSchema, type BoardResponse } from '@/types';

type BoardServiceBindings = Pick<WorkerBindings, 'DB'> & RuntimeConfigBindings;

export class BoardBootstrapError extends Error {}

export function getTodayForTimezone(
  timezone: string,
  now: Date = new Date(),
): ReturnType<typeof isoDateSchema.parse> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new BoardBootstrapError(
      `Unable to derive a board date for timezone ${timezone}.`,
    );
  }

  return isoDateSchema.parse(`${year}-${month}-${day}`);
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
