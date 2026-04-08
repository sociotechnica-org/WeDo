import { Outlet, useSearchParams } from 'react-router-dom';
import { boardRequestQuerySchema } from '@/types';
import { useFamilyBoard } from '@/ui/hooks/use-family-board';

export function BoardRoute() {
  const [searchParams] = useSearchParams();
  const query = boardRequestQuerySchema.parse({
    day: searchParams.get('day') ?? undefined,
  });
  const boardState = useFamilyBoard(query.day);

  if (boardState.status === 'loading') {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-sheet max-w-xl rounded-[2.6rem] border border-[rgba(107,90,75,0.08)] px-8 py-10 text-center">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Opening the board
          </p>
          <h1 className="hand-title mt-4 text-[4.8rem] leading-none text-[var(--color-ink)]">
            WeDo
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            Pulling the household page into view.
          </p>
        </div>
      </main>
    );
  }

  if (boardState.status === 'error') {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-sheet max-w-xl rounded-[2.6rem] border border-[rgba(107,90,75,0.08)] px-8 py-10 text-center">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Board unavailable
          </p>
          <h1 className="hand-title mt-4 text-[4.8rem] leading-none text-[var(--color-ink)]">
            WeDo
          </h1>
          <p className="hand-link mt-4 text-[1.35rem] leading-8 text-[var(--color-ink-soft)]">
            {boardState.message}
          </p>
        </div>
      </main>
    );
  }

  return <Outlet context={boardState} />;
}
