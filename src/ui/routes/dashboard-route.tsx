import { Link } from 'react-router-dom';
import { DayNavigation } from '@/ui/components/day-navigation';
import { PersonColumn } from '@/ui/components/person-column';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { useReadyBoard } from '@/ui/routes/use-ready-board';

export function DashboardRoute() {
  const { board, householdName, realtime, todayDate, toggleSkipDay } =
    useReadyBoard();
  const isSkipped = board.people.some(
    (personState) => personState.skip_day !== null,
  );

  return (
    <main className="paper-canvas min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-6">
        <header className="paper-sheet rounded-[2.8rem] border border-[rgba(107,90,75,0.08)] px-5 py-5 md:px-7 md:py-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="hand-title mt-2 text-[4.8rem] leading-[0.88] text-[var(--color-ink)] lg:text-[5.8rem]">
                WeDo
              </h1>
              <p className="mt-3 text-[0.98rem] leading-6 text-[var(--color-ink-soft)] lg:max-w-sm">
                {householdName} stays visible in one calm glance.
              </p>
            </div>

            <DayNavigation
              currentDate={board.day.date}
              isSkipped={isSkipped}
              onToggleSkipDay={toggleSkipDay}
              skipToggleDisabled={realtime.status !== 'live'}
              todayDate={todayDate}
            />

            <div className="justify-self-start md:justify-self-end">
              <Link
                className="stationery-link px-5 py-2.5 text-[1.1rem] text-[var(--color-ink)]"
                to={buildDayHref('/settings', board.day.date, todayDate)}
              >
                Settings
              </Link>
            </div>
          </div>
        </header>

        {realtime.status === 'degraded' ? (
          <RealtimeStatusBanner message={realtime.message} />
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {board.people.map((personState, index) => (
            <Link
              aria-label={`Open ${personState.person.name}'s list`}
              className="block rounded-[2.25rem] transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(93,151,206,0.24)]"
              data-testid="person-column-link"
              key={personState.person.id}
              to={buildDayHref(
                `/people/${personState.person.id}`,
                board.day.date,
                todayDate,
              )}
            >
              <PersonColumn paletteIndex={index} personState={personState} />
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
