import { CompletionRing } from '@/ui/components/completion-ring';
import type { PersonColumn as PersonColumnModel } from '@/types/board';

type PersonColumnProps = {
  column: PersonColumnModel;
};

export function PersonColumn({ column }: PersonColumnProps) {
  return (
    <section
      className="paper-panel relative overflow-hidden rounded-[2rem] border border-[rgba(87,72,58,0.08)] px-6 py-6"
      style={
        {
          '--column-ink': column.ink,
          '--column-wash': column.wash,
        } as React.CSSProperties
      }
    >
      <div className="absolute inset-x-0 top-0 h-28 rounded-t-[2rem] bg-[radial-gradient(circle_at_top_left,var(--column-wash),transparent_72%)] opacity-90" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="scribe-label text-xs uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
            Today&apos;s list
          </p>
          <h2
            className="mt-3 text-4xl leading-none tracking-[0.04em]"
            style={{ color: column.ink }}
          >
            {column.name}
          </h2>
        </div>
        <CompletionRing ratio={column.completionRatio} wash={column.wash} />
      </div>
      <ul className="relative mt-8 space-y-4">
        {column.tasks.map((task) => (
          <li
            key={task.id}
            className="rounded-[1.4rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.78)] px-4 py-4 shadow-[0_12px_24px_rgba(82,65,48,0.06)] backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="mt-1 size-6 shrink-0 rounded-full border border-[rgba(87,72,58,0.2)] bg-[rgba(255,252,247,0.95)] p-[3px]"
              >
                <div
                  className="size-full rounded-full border border-dashed border-[rgba(87,72,58,0.3)]"
                  style={{
                    background: task.completed ? column.wash : 'transparent',
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xl leading-tight text-[var(--color-ink)]">
                  {task.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {task.note}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
