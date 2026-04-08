import type { CSSProperties } from 'react';
import type { PersonDayState } from '@/types';
import { CompletionRing } from '@/ui/components/completion-ring';
import { getPersonPalette } from '@/ui/components/person-palette';
import { TaskRow } from '@/ui/components/task-row';

type PersonColumnProps = {
  personState: PersonDayState;
  paletteIndex: number;
};

function getStreakLabel(count: number) {
  if (count === 0) {
    return 'No streak yet';
  }

  if (count === 1) {
    return '1 day streak';
  }

  return `${count} day streak`;
}

export function PersonColumn({ personState, paletteIndex }: PersonColumnProps) {
  const palette = getPersonPalette(paletteIndex);
  const completedCount = personState.tasks.filter(
    (task) => task.completion !== null,
  ).length;
  const isSkipped = personState.skip_day !== null;

  return (
    <section
      className="paper-panel relative flex min-h-[29rem] flex-col overflow-hidden rounded-[2.25rem] border border-[rgba(107,90,75,0.08)] px-4 py-5 lg:min-h-[34rem]"
      data-skipped={isSkipped ? 'true' : 'false'}
      data-testid="person-column"
      style={
        {
          '--column-cloud': palette.cloud,
          '--column-ink': palette.ink,
        } as CSSProperties
      }
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,var(--column-cloud),transparent_68%)]" />
      <div className="absolute inset-y-6 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(107,90,75,0.1),transparent)]" />
      <div className="relative">
        <p className="scribe-label text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
          {getStreakLabel(personState.streak.current_count)}
        </p>
        <div className="mt-4 flex flex-col items-start gap-3">
          <CompletionRing
            completedCount={completedCount}
            innerTint={palette.mist}
            size="compact"
            tint={palette.wash}
            totalCount={personState.tasks.length}
          />
          <h2
            className="hand-title max-w-full text-[2.05rem] leading-[0.92] lg:text-[2.35rem]"
            style={{ color: palette.ink }}
          >
            {personState.person.name}
          </h2>
        </div>
      </div>

      <ul
        className={`relative mt-6 space-y-2.5 transition-opacity duration-200 ${isSkipped ? 'opacity-55' : 'opacity-100'}`}
        data-testid="person-task-list"
      >
        {personState.tasks.map((task) => (
          <TaskRow
            key={task.task.id}
            task={task}
            tint={palette.wash}
            variant="dashboard"
          />
        ))}
        {personState.tasks.length === 0 ? (
          <li className="rounded-[1.5rem] border border-dashed border-[rgba(107,90,75,0.12)] bg-[rgba(255,249,241,0.26)] px-4 py-4 text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
            No tasks today.
          </li>
        ) : null}
      </ul>

      <div className="pointer-events-none mt-6 flex-1 rounded-[1.6rem] bg-[linear-gradient(180deg,transparent,rgba(247,241,233,0.42))]" />
    </section>
  );
}
