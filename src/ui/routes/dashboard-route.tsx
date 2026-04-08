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
      <div className="mx-auto flex max-w-[90rem] flex-col gap-5">
        <header className="paper-panel rounded-[2.2rem] border border-[rgba(87,72,58,0.08)] px-5 py-5 shadow-[0_18px_36px_rgba(82,65,48,0.06)] md:px-7 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="mt-2 text-5xl leading-none text-[var(--color-ink)] lg:text-6xl">
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
              <button
                className="rounded-full border border-[rgba(87,72,58,0.10)] bg-[rgba(255,252,247,0.66)] px-4 py-2 text-sm tracking-[0.14em] text-[var(--color-ink-soft)] shadow-[0_10px_24px_rgba(82,65,48,0.04)]"
                disabled
                type="button"
              >
                Settings
              </button>
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
              className="block rounded-[1.9rem] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(87,72,58,0.24)]"
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
