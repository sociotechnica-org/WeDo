import { Link } from 'react-router-dom';
import { DayNavigation } from '@/ui/components/day-navigation';
import { PersonColumn } from '@/ui/components/person-column';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { SettingsLink } from '@/ui/components/settings-link';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { useReadyBoard } from '@/ui/routes/use-ready-board';

export function DashboardRoute() {
  const { board, realtime, todayDate, toggleSkipDay } = useReadyBoard();
  const isSkipped = board.people.some(
    (personState) => personState.skip_day !== null,
  );

  return (
    <main className="paper-canvas min-h-screen px-4 py-5 md:py-8 lg:py-10">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-6">
        <header className="px-1 py-1 md:px-2">
          <div className="grid gap-4 md:grid-cols-[auto_minmax(20rem,1fr)_auto] md:items-start">
            <div>
              <p className="scribe-label mb-1 text-[0.64rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="hand-title text-[2.4rem] leading-none text-[var(--color-ink)] lg:text-[3rem]">
                <Link
                  className="text-[var(--color-ink)] no-underline"
                  to={buildDayHref('/', board.day.date, todayDate)}
                >
                  WeDo
                </Link>
              </h1>
            </div>

            <DayNavigation
              currentDate={board.day.date}
              isSkipped={isSkipped}
              onToggleSkipDay={toggleSkipDay}
              skipToggleDisabled={realtime.status !== 'live'}
              todayDate={todayDate}
            />

            <div className="justify-self-start md:justify-self-end">
              <SettingsLink
                to={buildDayHref('/settings', board.day.date, todayDate)}
              />
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
