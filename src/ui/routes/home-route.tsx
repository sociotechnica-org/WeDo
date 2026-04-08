import { PersonColumn } from '@/ui/components/person-column';
import { useBoardSnapshot } from '@/ui/hooks/use-board-snapshot';

export function HomeRoute() {
  const boardState = useBoardSnapshot();

  if (boardState.status === 'loading') {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-panel max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgba(82,65,48,0.10)]">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Setting the board
          </p>
          <h1 className="mt-4 text-5xl text-[var(--color-ink)]">WeDo</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            Ink is drying on today&apos;s household page.
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

  const { board } = boardState;

  return (
    <main className="paper-canvas min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="paper-panel overflow-hidden rounded-[2.5rem] px-8 py-8 shadow-[0_24px_60px_rgba(82,65,48,0.10)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,169,201,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(202,176,151,0.18),transparent_44%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="scribe-label text-xs uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
                Shared family daily task board
              </p>
              <h1 className="mt-3 text-6xl leading-none text-[var(--color-ink)] md:text-7xl">
                WeDo
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
                {board.householdName} keeps the day in one place: visible, calm,
                and lightly marked by whoever was there.
              </p>
            </div>
            <div className="rounded-[1.7rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.72)] px-5 py-4 text-right shadow-[0_12px_24px_rgba(82,65,48,0.06)]">
              <p className="scribe-label text-xs uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
                Day frame
              </p>
              <p className="mt-2 text-2xl text-[var(--color-ink)]">
                {board.dayLabel}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-3">
          {board.columns.map((column) => (
            <PersonColumn key={column.id} column={column} />
          ))}
        </section>
      </div>
    </main>
  );
}
