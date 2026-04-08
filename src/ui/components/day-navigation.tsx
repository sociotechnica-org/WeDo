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
  isSkipped: boolean;
  onToggleSkipDay: () => boolean;
  skipToggleDisabled?: boolean;
};

function arrowClassName(disabled = false) {
  return [
    'stationery-link inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1.4rem] border text-[1.65rem] leading-none transition-transform duration-200',
    disabled
      ? 'cursor-not-allowed border-[rgba(107,90,75,0.08)] bg-[rgba(245,237,227,0.46)] text-[rgba(123,107,92,0.45)] shadow-none'
      : 'border-[rgba(107,90,75,0.12)] px-0 py-0 text-[var(--color-ink)]',
  ].join(' ');
}

export function DayNavigation({
  currentDate,
  todayDate,
  isSkipped,
  onToggleSkipDay,
  skipToggleDisabled = false,
}: DayNavigationProps) {
  const location = useLocation();
  const previousDate = getPreviousDay(currentDate);
  const nextDate = getNextDay(currentDate);
  const nextDisabled = isAtTomorrowLimit(currentDate, todayDate);
  const skipToggleLabel = currentDate === todayDate ? 'SKIP TODAY' : 'SKIP DAY';

  return (
    <div
      className="paper-sheet grid gap-3 rounded-[2rem] border border-[rgba(107,90,75,0.08)] px-3 py-3 sm:grid-cols-[auto_minmax(12rem,1fr)_auto] sm:items-center sm:gap-4"
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

      <div className="min-w-0 px-1 text-left sm:text-center">
        <p className="scribe-label text-[0.58rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
          Day
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3 sm:justify-center">
          <p
            className={`hand-title truncate text-[2rem] leading-none text-[var(--color-ink)] transition-all duration-200 lg:text-[2.35rem] ${isSkipped ? 'line-through decoration-[rgba(107,90,75,0.58)] decoration-[2px]' : ''}`}
            data-skipped={isSkipped ? 'true' : 'false'}
            data-testid="day-label"
          >
            {formatDayLabel(currentDate)}
          </p>
          <button
            aria-label={`Toggle skip day for ${formatDayLabel(currentDate)}`}
            aria-pressed={isSkipped}
            className={`stationery-button px-4 py-2 text-[1rem] ${isSkipped ? 'border-[rgba(107,90,75,0.16)] bg-[rgba(177,201,220,0.28)] text-[var(--color-ink)]' : 'stationery-button--muted text-[var(--color-ink-soft)]'} disabled:cursor-not-allowed disabled:opacity-55`}
            data-testid="day-skip-toggle"
            disabled={skipToggleDisabled}
            onClick={onToggleSkipDay}
            type="button"
          >
            {skipToggleLabel}
          </button>
        </div>
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
