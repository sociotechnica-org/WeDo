import { Link, useParams } from 'react-router-dom';
import { CompletionRing } from '@/ui/components/completion-ring';
import { DayNavigation } from '@/ui/components/day-navigation';
import { getPersonPalette } from '@/ui/components/person-palette';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { TaskRow } from '@/ui/components/task-row';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { useReadyBoard } from '@/ui/routes/use-ready-board';

export function SingleListRoute() {
  const { personId } = useParams();
  const { board, realtime, todayDate, toggleTask } = useReadyBoard();
  const personIndex = board.people.findIndex(
    (personState) => personState.person.id === personId,
  );
  const personState = personIndex >= 0 ? board.people[personIndex] : undefined;

  if (!personState) {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-panel max-w-xl rounded-[2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgba(82,65,48,0.10)]">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Person not found
          </p>
          <h1 className="mt-4 text-5xl text-[var(--color-ink)]">WeDo</h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            That list is no longer available on the current board.
          </p>
          <Link
            className="mt-6 inline-flex rounded-[1.2rem] border border-[rgba(87,72,58,0.10)] bg-[rgba(255,252,247,0.78)] px-4 py-2 text-[0.98rem] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(82,65,48,0.05)]"
            to={buildDayHref('/', board.day.date, todayDate)}
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const palette = getPersonPalette(personIndex);
  const completedCount = personState.tasks.filter(
    (task) => task.completion !== null,
  ).length;

  return (
    <main className="paper-canvas min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[76rem] flex-col gap-5">
        <header className="paper-panel rounded-[2.2rem] border border-[rgba(87,72,58,0.08)] px-5 py-5 shadow-[0_18px_36px_rgba(82,65,48,0.06)] md:px-7 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="mt-2 text-5xl leading-none text-[var(--color-ink)] lg:text-6xl">
                WeDo
              </h1>
              <Link
                className="mt-4 inline-flex rounded-[1.2rem] border border-[rgba(87,72,58,0.10)] bg-[rgba(255,252,247,0.78)] px-4 py-2 text-[0.98rem] text-[var(--color-ink)] shadow-[0_10px_24px_rgba(82,65,48,0.05)]"
                to={buildDayHref('/', board.day.date, todayDate)}
              >
                Back
              </Link>
            </div>

            <DayNavigation currentDate={board.day.date} todayDate={todayDate} />

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

        <section
          className="paper-panel relative overflow-hidden rounded-[2.2rem] border border-[rgba(87,72,58,0.08)] px-6 py-8 shadow-[0_18px_36px_rgba(82,65,48,0.06)] md:px-10 md:py-10"
          style={{
            background: `radial-gradient(circle at top, ${palette.cloud}, transparent 34%), linear-gradient(180deg, rgba(255, 253, 250, 0.88), rgba(248, 242, 233, 0.88))`,
          }}
        >
          <div className="relative flex flex-col items-center text-center">
            <CompletionRing
              completedCount={completedCount}
              innerTint={palette.mist}
              size="focused"
              tint={palette.wash}
              totalCount={personState.tasks.length}
            />
            <p className="scribe-label mt-5 text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
              Focused list
            </p>
            <h2
              className="mt-3 text-[3rem] leading-none md:text-[4rem]"
              style={{ color: palette.ink }}
            >
              {personState.person.name}
            </h2>
            <p className="mt-3 text-[1.02rem] leading-6 text-[var(--color-ink-soft)]">
              {completedCount} of {personState.tasks.length} tasks marked for
              this day.
            </p>
          </div>

          <ul className="relative mx-auto mt-10 max-w-4xl space-y-4">
            {personState.tasks.map((task) => (
              <TaskRow
                disabled={realtime.status !== 'live'}
                key={task.task.id}
                onPress={() => {
                  toggleTask(task.task.id);
                }}
                task={task}
                tint={palette.wash}
                variant="single-list"
              />
            ))}
            {personState.tasks.length === 0 ? (
              <li className="rounded-[1.35rem] border border-dashed border-[rgba(87,72,58,0.12)] px-5 py-6 text-center text-[1.08rem] leading-7 text-[var(--color-ink-soft)]">
                No tasks for this day.
              </li>
            ) : null}
          </ul>

          <div className="mt-8 flex justify-center">
            <button
              className="rounded-[1.4rem] border border-[rgba(87,72,58,0.10)] bg-[rgba(255,252,247,0.8)] px-8 py-4 text-[1.05rem] tracking-[0.08em] text-[var(--color-ink-soft)] shadow-[0_12px_28px_rgba(82,65,48,0.05)]"
              disabled
              type="button"
            >
              Add task
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
