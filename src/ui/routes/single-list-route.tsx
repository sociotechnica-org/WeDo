import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CompletionRing } from '@/ui/components/completion-ring';
import { DayNavigation } from '@/ui/components/day-navigation';
import { getPersonPalette } from '@/ui/components/person-palette';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { TaskRow } from '@/ui/components/task-row';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { useReadyBoard } from '@/ui/routes/use-ready-board';

function getProgressMessage(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 'No tasks resting on this page today.';
  }

  const taskLabel = totalCount === 1 ? 'task' : 'tasks';
  const countMessage = `${completedCount} of ${totalCount} ${taskLabel} marked for this day.`;

  if (completedCount === totalCount) {
    return `${countMessage} Everything on this page is resting in blue.`;
  }

  return `${countMessage} Tap any line to wash it blue.`;
}

export function SingleListRoute() {
  const { personId } = useParams();
  const {
    board,
    createTask,
    deleteTask,
    realtime,
    todayDate,
    toggleSkipDay,
    toggleTask,
  } = useReadyBoard();
  const personIndex = board.people.findIndex(
    (personState) => personState.person.id === personId,
  );
  const personState = personIndex >= 0 ? board.people[personIndex] : undefined;
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isComposerOpen) {
      inputRef.current?.focus();
    }
  }, [isComposerOpen]);

  if (!personState) {
    return (
      <main className="paper-canvas grid min-h-screen place-items-center px-6 py-10">
        <div className="paper-sheet max-w-xl rounded-[2.6rem] border border-[rgba(107,90,75,0.08)] px-8 py-10 text-center">
          <p className="scribe-label text-sm uppercase tracking-[0.35em] text-[var(--color-ink-soft)]">
            Person not found
          </p>
          <h1 className="hand-title mt-4 text-[4.8rem] leading-none text-[var(--color-ink)]">
            WeDo
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-soft)]">
            That list is no longer available on the current board.
          </p>
          <Link
            className="stationery-link mt-6 px-5 py-2.5 text-[1.05rem]"
            to={buildDayHref('/', board.day.date, todayDate)}
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const focusedPerson = personState.person;
  const isSkipped = personState.skip_day !== null;
  const palette = getPersonPalette(personIndex);
  const completedCount = personState.tasks.filter(
    (task) => task.completion !== null,
  ).length;
  const trimmedInput = rawInput.trim();

  async function handleCreateTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedInput) {
      setErrorMessage('Describe the task and its schedule to add it.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      await createTask(focusedPerson.id, trimmedInput);
      setRawInput('');
      setIsComposerOpen(false);
      setNoticeMessage('Task added to the recurring schedule.');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Task creation failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="paper-canvas min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[78rem] flex-col gap-6">
        <header className="paper-sheet rounded-[2.8rem] border border-[rgba(107,90,75,0.08)] px-5 py-5 md:px-7 md:py-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="hand-title mt-2 text-[4.8rem] leading-[0.88] text-[var(--color-ink)] lg:text-[5.8rem]">
                WeDo
              </h1>
              <Link
                className="stationery-link mt-4 px-5 py-2.5 text-[1.2rem]"
                to={buildDayHref('/', board.day.date, todayDate)}
              >
                <span aria-hidden="true">←</span>
                <span>Back</span>
              </Link>
            </div>

            <DayNavigation
              currentDate={board.day.date}
              isSkipped={isSkipped}
              onToggleSkipDay={toggleSkipDay}
              skipToggleDisabled={realtime.status !== 'live'}
              todayDate={todayDate}
            />

            <div className="justify-self-start md:justify-self-end">
              <Link
                className="stationery-link px-5 py-2.5 text-[1.1rem] text-[var(--color-ink)]"
                to={buildDayHref('/settings', board.day.date, todayDate)}
              >
                Settings
              </Link>
            </div>
          </div>
        </header>

        {realtime.status === 'degraded' ? (
          <RealtimeStatusBanner message={realtime.message} />
        ) : null}

        <section
          className="paper-sheet relative overflow-hidden rounded-[3rem] border border-[rgba(107,90,75,0.08)] px-6 py-8 md:px-10 md:py-10"
          style={{
            background: `radial-gradient(circle at top, ${palette.cloud}, transparent 32%), linear-gradient(180deg, rgba(255, 253, 250, 0.9), rgba(248, 242, 233, 0.8))`,
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
              className="hand-title mt-3 text-[4.2rem] leading-[0.88] md:text-[5.6rem]"
              style={{ color: palette.ink }}
            >
              {personState.person.name}
            </h2>
            <p className="hand-link mt-4 text-[1.3rem] leading-8 text-[var(--color-ink-soft)]">
              {getProgressMessage(completedCount, personState.tasks.length)}
            </p>
          </div>

          <ul
            className={`relative mx-auto mt-10 max-w-4xl space-y-4 transition-opacity duration-200 ${isSkipped ? 'opacity-55' : 'opacity-100'}`}
            data-testid="single-list-task-list"
          >
            {personState.tasks.map((task) => (
              <TaskRow
                disabled={realtime.status !== 'live'}
                key={task.task.id}
                onDelete={() => {
                  deleteTask(task.task.id);
                }}
                onPress={() => {
                  toggleTask(task.task.id);
                }}
                task={task}
                tint={palette.wash}
                variant="single-list"
              />
            ))}
            {personState.tasks.length === 0 ? (
              <li className="rounded-[1.9rem] border border-dashed border-[rgba(107,90,75,0.12)] bg-[rgba(255,249,241,0.32)] px-5 py-6 text-center text-[1.08rem] leading-7 text-[var(--color-ink-soft)]">
                No tasks for this day.
              </li>
            ) : null}
          </ul>

          <div className="mt-8 flex justify-center">
            {isComposerOpen ? (
              <form
                className="paper-panel w-full max-w-3xl rounded-[2rem] border border-[rgba(107,90,75,0.1)] px-5 py-5"
                onSubmit={(event) => {
                  void handleCreateTaskSubmit(event);
                }}
              >
                <label
                  className="scribe-label text-[0.68rem] uppercase tracking-[0.28em] text-[var(--color-ink-soft)]"
                  htmlFor="task-entry-input"
                >
                  Add task
                </label>
                <input
                  className="stationery-input mt-3 px-4 py-3 text-[1.05rem]"
                  disabled={isSubmitting}
                  id="task-entry-input"
                  onChange={(event) => {
                    setRawInput(event.target.value);
                  }}
                  placeholder="Practice piano Monday Tuesday Thursday Friday"
                  ref={inputRef}
                  value={rawInput}
                />
                {errorMessage ? (
                  <p className="mt-3 text-[0.94rem] text-[var(--color-ink-soft)]">
                    {errorMessage}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-end gap-3">
                  <button
                    className="stationery-button stationery-button--muted px-5 py-2.5 text-[1.05rem]"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsComposerOpen(false);
                      setRawInput('');
                      setErrorMessage(null);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="stationery-button px-5 py-2.5 text-[1.05rem] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting || trimmedInput.length === 0}
                    type="submit"
                  >
                    {isSubmitting ? 'Creating…' : 'Create task'}
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="stationery-button px-8 py-4 text-[1.35rem] text-[var(--color-ink)]"
                onClick={() => {
                  setIsComposerOpen(true);
                  setErrorMessage(null);
                  setNoticeMessage(null);
                }}
                type="button"
              >
                Add task
              </button>
            )}
          </div>
          {noticeMessage ? (
            <p className="mt-4 text-center text-[0.95rem] text-[var(--color-ink-soft)]">
              {noticeMessage}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
