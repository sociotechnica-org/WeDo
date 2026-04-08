import type { TaskInstance } from '@/types';

type TaskRowProps = {
  task: TaskInstance;
  tint: string;
  variant: 'dashboard' | 'single-list';
  onPress?: () => void;
  disabled?: boolean;
};

export function TaskRow({
  task,
  tint,
  variant,
  onPress,
  disabled = false,
}: TaskRowProps) {
  const isCompleted = task.completion !== null;
  const isInteractive = variant === 'single-list' && onPress !== undefined;
  const checkboxSize = variant === 'single-list' ? 'size-7' : 'size-5';
  const checkboxInnerSize = variant === 'single-list' ? 'size-4' : 'size-2.5';
  const emojiSize = variant === 'single-list' ? 'text-2xl' : 'text-lg';
  const rowPadding =
    variant === 'single-list' ? 'px-5 py-4 md:px-6 md:py-5' : 'px-3.5 py-3.5';
  const rowTextSize =
    variant === 'single-list'
      ? 'text-[1.18rem] leading-7 md:text-[1.32rem] md:leading-8'
      : 'text-[1.02rem] leading-6';

  const content = (
    <div className={`flex items-start gap-3 ${variant === 'single-list' ? 'md:gap-4' : ''}`}>
      <div
        aria-hidden="true"
        className={`mt-1 grid shrink-0 place-items-center rounded-[0.55rem] border border-[rgba(87,72,58,0.28)] bg-[rgba(255,252,247,0.94)] ${checkboxSize}`}
      >
        <div
          className={`${checkboxInnerSize} rounded-[0.3rem] transition-colors`}
          style={{
            background: isCompleted ? tint : 'transparent',
            boxShadow: isCompleted
              ? 'inset 0 0 0 1px rgba(87,72,58,0.08)'
              : 'inset 0 0 0 1px rgba(87,72,58,0.12)',
          }}
        />
      </div>
      <span aria-hidden="true" className={`${emojiSize} leading-none`}>
        {task.task.emoji}
      </span>
      <span
        className={`min-w-0 flex-1 ${rowTextSize} text-[var(--color-ink)]`}
        style={{
          opacity: isCompleted ? 0.72 : 1,
          textDecoration: isCompleted ? 'line-through' : 'none',
          textDecorationThickness: '1px',
        }}
      >
        {task.task.title}
      </span>
    </div>
  );

  return (
    <li
      className={`rounded-[1.35rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.84)] shadow-[0_10px_24px_rgba(82,65,48,0.05)] ${rowPadding}`}
      data-testid="task-row"
    >
      {isInteractive ? (
        <button
          aria-label={`Toggle ${task.task.title}`}
          className="block w-full text-left disabled:cursor-not-allowed"
          disabled={disabled}
          onClick={onPress}
          type="button"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  );
}
