import { PersonColumn } from '@/ui/components/person-column';
import { useFamilyBoard } from '@/ui/hooks/use-family-board';

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

export function HomeRoute() {
  const boardState = useFamilyBoard();

  if (boardState.status === 'loading') {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-panel max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgba(82,65,48,0.10)]">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Opening the board
          </p>
          <h1 className="mt-4 text-5xl text-[var(--color-ink)]">WeDo</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            Pulling today&apos;s household page into view.
          </p>
        </div>
      </main>
    );
  }

  if (boardState.status === 'error') {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-panel max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgba(82,65,48,0.10)]">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Board unavailable
          </p>
          <h1 className="mt-4 text-5xl text-[var(--color-ink)]">WeDo</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            {boardState.message}
          </p>
        </div>
      </main>
    );
  }

  const { board, householdName, realtime } = boardState;

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

            <div className="justify-self-start rounded-[1.5rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.78)] px-4 py-3 text-left shadow-[0_10px_24px_rgba(82,65,48,0.05)] md:justify-self-center md:text-center">
              <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
                Today
              </p>
              <p className="mt-1 text-xl text-[var(--color-ink)] lg:text-2xl">
                {formatDayLabel(board.day.date)}
              </p>
            </div>

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
          <section
            aria-live="polite"
            className="paper-panel rounded-[1.6rem] border border-[rgba(128,102,80,0.12)] px-5 py-4 shadow-[0_12px_26px_rgba(82,65,48,0.05)]"
            role="status"
          >
            <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
              Live updates paused
            </p>
            <p className="mt-2 text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
              {realtime.message}
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {board.people.map((personState, index) => (
            <PersonColumn
              key={personState.person.id}
              paletteIndex={index}
              personState={personState}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
