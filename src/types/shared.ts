import { z } from 'zod';

export const nonEmptyStringSchema = z.string().trim().min(1);

export const identifierSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim() === value, {
    message: 'Identifiers must not include leading or trailing whitespace.',
  });

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO calendar date (YYYY-MM-DD).');

export const isoTimestampSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    'Expected an ISO timestamp.',
  );

export const dayCodeSchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

export const scheduleRulesSchema = z
  .object({
    days: z.array(dayCodeSchema).min(1).max(7),
  })
  .strict()
  .refine((value) => new Set(value.days).size === value.days.length, {
    message: 'Schedule day codes must be unique.',
    path: ['days'],
  });

export const defaultTimezone = 'America/New_York' as const;

export const timezoneSchema = z.literal(defaultTimezone);

function createUtcDateFromIsoDate(value: IsoDate): Date {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12));
}

export function addDaysToIsoDate(date: IsoDate, amount: number): IsoDate {
  const nextDate = createUtcDateFromIsoDate(date);

  nextDate.setUTCDate(nextDate.getUTCDate() + amount);

  const year = nextDate.getUTCFullYear();
  const month = `${nextDate.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${nextDate.getUTCDate()}`.padStart(2, '0');

  return isoDateSchema.parse(`${year}-${month}-${day}`);
}

export function compareIsoDates(left: IsoDate, right: IsoDate): number {
  return left.localeCompare(right);
}

export type Identifier = z.infer<typeof identifierSchema>;
export type IsoDate = z.infer<typeof isoDateSchema>;
export type IsoTimestamp = z.infer<typeof isoTimestampSchema>;
export type DayCode = z.infer<typeof dayCodeSchema>;
export type ScheduleRules = z.infer<typeof scheduleRulesSchema>;
export type Timezone = z.infer<typeof timezoneSchema>;
