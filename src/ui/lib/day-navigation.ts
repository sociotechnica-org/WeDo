import { addDaysToIsoDate, compareIsoDates, type IsoDate } from '@/types';

export function getPreviousDay(date: IsoDate): IsoDate {
  return addDaysToIsoDate(date, -1);
}

export function getNextDay(date: IsoDate): IsoDate {
  return addDaysToIsoDate(date, 1);
}

export function isAtTomorrowLimit(
  currentDate: IsoDate,
  todayDate: IsoDate,
): boolean {
  return compareIsoDates(currentDate, getNextDay(todayDate)) >= 0;
}

export function buildDaySearch(
  targetDate: IsoDate,
  todayDate: IsoDate,
): string {
  if (targetDate === todayDate) {
    return '';
  }

  return `?day=${targetDate}`;
}

export function buildDayHref(
  pathname: string,
  targetDate: IsoDate,
  todayDate: IsoDate,
): string {
  const search = buildDaySearch(targetDate, todayDate);

  return `${pathname}${search}`;
}
