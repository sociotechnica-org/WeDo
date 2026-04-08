import {
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { TaskInstance } from '@/types';

const deleteRevealWidth = 88;
const swipeRevealThreshold = 44;

type TaskRowProps = {
  task: TaskInstance;
  tint: string;
  variant: 'dashboard' | 'single-list';
  onPress?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
};

type GestureState = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  originReveal: number;
  direction: 'pending' | 'horizontal' | 'vertical';
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M9.5 3.75h5" />
      <path d="M7.5 7l.8 11.2a1.5 1.5 0 0 0 1.49 1.4h4.42a1.5 1.5 0 0 0 1.49-1.4L16.5 7" />
      <path d="M10 10.5v5.25" />
      <path d="M14 10.5v5.25" />
    </svg>
  );
}

export function TaskRow({
  task,
  tint,
  variant,
  onPress,
  onDelete,
  disabled = false,
}: TaskRowProps) {
  const containerRef = useRef<HTMLLIElement | null>(null);
  const gestureRef = useRef<GestureState | null>(null);
  const dragRevealRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragReveal, setDragReveal] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isTouchRevealOpen, setIsTouchRevealOpen] = useState(false);
  const isCompleted = task.completion !== null;
  const isInteractive = variant === 'single-list' && onPress !== undefined;
  const canDelete = variant === 'single-list' && onDelete !== undefined;
  const checkboxSize = variant === 'single-list' ? 'size-7' : 'size-5';
  const checkboxInnerSize = variant === 'single-list' ? 'size-4' : 'size-2.5';
  const checkboxRadius =
    variant === 'single-list' ? 'rounded-[0.55rem]' : 'rounded-[0.45rem]';
  const checkboxInnerRadius =
    variant === 'single-list' ? 'rounded-[0.3rem]' : 'rounded-[0.2rem]';
  const emojiSize = variant === 'single-list' ? 'text-2xl' : 'text-lg';
  const rowPadding =
    variant === 'single-list' ? 'px-5 py-4 md:px-6 md:py-5' : 'px-3.5 py-3.5';
  const rowTextSize =
    variant === 'single-list'
      ? 'text-[1.18rem] leading-7 md:text-[1.32rem] md:leading-8'
      : 'text-[1.02rem] leading-6';
  const deleteReveal =
    dragReveal > 0
      ? dragReveal
      : canDelete && (isHovered || isFocusWithin || isTouchRevealOpen)
        ? deleteRevealWidth
        : 0;
  const isDeleteVisible = deleteReveal > 0;

  function clearGesture() {
    gestureRef.current = null;
    dragRevealRef.current = 0;
    setDragReveal(0);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!canDelete || disabled || event.pointerType !== 'touch') {
      return;
    }

    gestureRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      originReveal: isTouchRevealOpen ? deleteRevealWidth : 0,
      direction: 'pending',
    };
    dragRevealRef.current = gestureRef.current.originReveal;

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = gestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = Math.abs(event.clientY - gesture.startY);
    const absoluteDeltaX = Math.abs(deltaX);

    if (gesture.direction === 'pending') {
      if (absoluteDeltaX < 8 && deltaY < 8) {
        return;
      }

      gesture.direction = absoluteDeltaX > deltaY ? 'horizontal' : 'vertical';
    }

    if (gesture.direction !== 'horizontal') {
      return;
    }

    suppressClickRef.current = true;
    const nextReveal = clamp(gesture.originReveal - deltaX, 0, deleteRevealWidth);

    dragRevealRef.current = nextReveal;
    setDragReveal(nextReveal);
  }

  function finalizeSwipeReveal(pointerId: number) {
    const gesture = gestureRef.current;

    if (!gesture || gesture.pointerId !== pointerId) {
      return;
    }

    const shouldReveal = dragRevealRef.current >= swipeRevealThreshold;

    setIsTouchRevealOpen(shouldReveal);
    clearGesture();
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    finalizeSwipeReveal(event.pointerId);
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    finalizeSwipeReveal(event.pointerId);
  }

  function handleRowClick() {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    if (isTouchRevealOpen) {
      setIsTouchRevealOpen(false);
      return;
    }

    setIsTouchRevealOpen(false);
    onPress?.();
  }

  function handleDeleteClick() {
    setIsTouchRevealOpen(false);
    onDelete?.();
  }

  function handleFocusCapture() {
    setIsFocusWithin(true);
  }

  function handleBlurCapture(event: FocusEvent<HTMLLIElement>) {
    const nextFocused = event.relatedTarget;

    if (nextFocused instanceof Node && containerRef.current?.contains(nextFocused)) {
      return;
    }

    setIsFocusWithin(false);
  }

  const content = (
    <div className={`flex items-start gap-3 ${variant === 'single-list' ? 'md:gap-4' : ''}`}>
      <div
        aria-hidden="true"
        className={`mt-1 grid shrink-0 place-items-center border border-[rgba(87,72,58,0.28)] bg-[rgba(255,252,247,0.94)] ${checkboxRadius} ${checkboxSize}`}
      >
        <div
          className={`${checkboxInnerRadius} ${checkboxInnerSize} transition-colors`}
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

  if (!canDelete) {
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
            onClick={handleRowClick}
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

  return (
    <li
      className="relative overflow-hidden rounded-[1.35rem] border border-[rgba(87,72,58,0.08)] bg-[rgba(255,252,247,0.84)] shadow-[0_10px_24px_rgba(82,65,48,0.05)]"
      data-testid="task-row"
      onBlurCapture={handleBlurCapture}
      onFocusCapture={handleFocusCapture}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      ref={containerRef}
    >
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {isDeleteVisible ? (
          <button
            aria-label={`Delete ${task.task.title}`}
            className="inline-flex h-[calc(100%-1rem)] w-16 items-center justify-center rounded-[1.1rem] border border-[rgba(87,72,58,0.12)] bg-[linear-gradient(180deg,rgba(227,214,197,0.94),rgba(214,199,182,0.94))] text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="task-row-delete"
            disabled={disabled}
            onClick={handleDeleteClick}
            type="button"
          >
            <TrashIcon />
          </button>
        ) : null}
      </div>
      <button
        aria-label={`Toggle ${task.task.title}`}
        className={`relative z-10 block w-full rounded-[1.35rem] bg-[rgba(255,252,247,0.84)] text-left transition-transform duration-200 disabled:cursor-not-allowed ${rowPadding}`}
        disabled={disabled}
        onClick={handleRowClick}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          transform: `translateX(-${deleteReveal}px)`,
          touchAction: 'pan-y',
        }}
        type="button"
      >
        {content}
      </button>
    </li>
  );
}
