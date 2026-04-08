import {
  defaultTimezone,
  isoDateSchema,
  type IsoDate,
  type Timezone,
} from '@/types';

export const wedoTimezone = defaultTimezone;

export function getIsoDateForTimezone(
  timezone: Timezone = wedoTimezone,
  now: Date = new Date(),
): IsoDate {
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
    throw new Error(`Unable to derive an ISO date for timezone ${timezone}.`);
  }

  return isoDateSchema.parse(`${year}-${month}-${day}`);
}
