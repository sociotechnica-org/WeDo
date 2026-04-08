import type { TaskInstance } from '@/types';

type TaskRowProps = {
  task: TaskInstance;
  tint: string;
};

export function TaskRow({ task, tint }: TaskRowProps) {
  const isCompleted = task.completion !== null;

  return (
    <li
      className="rounded-[1.35rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.84)] px-3.5 py-3.5 shadow-[0_10px_24px_rgba(82,65,48,0.05)]"
      data-testid="task-row"
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="mt-1 grid size-5 shrink-0 place-items-center rounded-[0.45rem] border border-[rgba(87,72,58,0.28)] bg-[rgba(255,252,247,0.94)]"
        >
          <div
            className="size-2.5 rounded-[0.2rem] transition-colors"
            style={{
              background: isCompleted ? tint : 'transparent',
              boxShadow: isCompleted
                ? 'inset 0 0 0 1px rgba(87,72,58,0.08)'
                : 'inset 0 0 0 1px rgba(87,72,58,0.12)',
            }}
          />
        </div>
        <span aria-hidden="true" className="text-lg leading-none">
          {task.task.emoji}
        </span>
        <span
          className="min-w-0 flex-1 text-[1.02rem] leading-6 text-[var(--color-ink)]"
          style={{
            opacity: isCompleted ? 0.72 : 1,
            textDecoration: isCompleted ? 'line-through' : 'none',
            textDecorationThickness: '1px',
          }}
        >
          {task.task.title}
        </span>
      </div>
    </li>
  );
}
