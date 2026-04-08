import { Link, useLocation } from 'react-router-dom';
import type { IsoDate } from '@/types';
import {
  buildDayHref,
  getNextDay,
  getPreviousDay,
  isAtTomorrowLimit,
} from '@/ui/lib/day-navigation';
import { formatDayLabel } from '@/ui/lib/format-day-label';

type DayNavigationProps = {
  currentDate: IsoDate;
  todayDate: IsoDate;
};

function arrowClassName(disabled = false) {
  return [
    'inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] border text-2xl transition-transform duration-200',
    disabled
      ? 'cursor-not-allowed border-[rgba(87,72,58,0.07)] bg-[rgba(242,235,225,0.42)] text-[rgba(123,107,92,0.45)] shadow-none'
      : 'border-[rgba(87,72,58,0.10)] bg-[rgba(255,252,247,0.82)] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(82,65,48,0.05)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,72,58,0.22)]',
  ].join(' ');
}

export function DayNavigation({ currentDate, todayDate }: DayNavigationProps) {
  const location = useLocation();
  const previousDate = getPreviousDay(currentDate);
  const nextDate = getNextDay(currentDate);
  const nextDisabled = isAtTomorrowLimit(currentDate, todayDate);

  return (
    <div
      className="grid gap-3 rounded-[1.7rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.78)] px-3 py-3 shadow-[0_10px_24px_rgba(82,65,48,0.05)] sm:grid-cols-[auto_minmax(12rem,1fr)_auto] sm:items-center sm:gap-4"
      data-testid="day-navigation"
    >
      <Link
        aria-label="Go to previous day"
        className={arrowClassName()}
        data-testid="day-nav-previous"
        to={buildDayHref(location.pathname, previousDate, todayDate)}
      >
        <span aria-hidden="true">←</span>
      </Link>

      <div className="min-w-0 text-left sm:text-center">
        <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
          Day
        </p>
        <p
          className="mt-1 truncate text-xl text-[var(--color-ink)] lg:text-2xl"
          data-testid="day-label"
        >
          {formatDayLabel(currentDate)}
        </p>
      </div>

      {nextDisabled ? (
        <button
          aria-label="Go to next day"
          className={arrowClassName(true)}
          data-testid="day-nav-next"
          disabled
          type="button"
        >
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <Link
          aria-label="Go to next day"
          className={arrowClassName()}
          data-testid="day-nav-next"
          to={buildDayHref(location.pathname, nextDate, todayDate)}
        >
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
