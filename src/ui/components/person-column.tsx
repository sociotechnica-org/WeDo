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

  return (
    <section
      className="paper-panel relative flex min-h-[28rem] flex-col overflow-hidden rounded-[1.9rem] border border-[rgba(87,72,58,0.08)] px-4 py-5 shadow-[0_18px_36px_rgba(82,65,48,0.06)] lg:min-h-[34rem]"
      data-testid="person-column"
      style={
        {
          '--column-cloud': palette.cloud,
          '--column-ink': palette.ink,
        } as CSSProperties
      }
    >
      <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,var(--column-cloud),transparent_72%)]" />
      <div className="relative">
        <p className="scribe-label text-[0.62rem] uppercase tracking-[0.34em] text-[var(--color-ink-soft)]">
          {getStreakLabel(personState.streak.current_count)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <h2
            className="text-[2rem] leading-none lg:text-[2.25rem]"
            style={{ color: palette.ink }}
          >
            {personState.person.name}
          </h2>
          <CompletionRing
            completedCount={completedCount}
            innerTint={palette.mist}
            size="compact"
            tint={palette.wash}
            totalCount={personState.tasks.length}
          />
        </div>
      </div>

      <ul className="relative mt-6 space-y-3">
        {personState.tasks.map((task) => (
          <TaskRow
            key={task.task.id}
            task={task}
            tint={palette.wash}
            variant="dashboard"
          />
        ))}
        {personState.tasks.length === 0 ? (
          <li className="rounded-[1.35rem] border border-dashed border-[rgba(87,72,58,0.12)] px-3.5 py-4 text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
            No tasks today.
          </li>
        ) : null}
      </ul>

      <div className="pointer-events-none mt-6 flex-1 rounded-[1.4rem] bg-[linear-gradient(180deg,transparent,rgba(247,241,233,0.48))]" />
    </section>
  );
}
