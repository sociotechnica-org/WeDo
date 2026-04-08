import { useId, type CSSProperties } from 'react';
import type { FamilyBoardState, PersonDayState, TaskInstance } from '@/types';
import { formatDayLabel } from '@/ui/lib/format-day-label';
import { getPersonPalette } from './person-palette';

type WatercolorPrototypeProps = {
  board: FamilyBoardState;
  householdName: string;
};

type PrototypePaletteVars = CSSProperties & {
  '--prototype-cloud': string;
  '--prototype-ink': string;
  '--prototype-mist': string;
  '--prototype-wash': string;
};

type TypeStudy = {
  key: string;
  label: string;
  sampleName: string;
  sampleTask: string;
  note: string;
};

function getCompletedCount(personState: PersonDayState) {
  return personState.tasks.filter((task) => task.completion !== null).length;
}

function getTaskSample(board: FamilyBoardState, sampleIndex: number) {
  const studyTasks = board.people.flatMap((personState) => personState.tasks);

  if (studyTasks.length === 0) {
    return 'Morning page';
  }

  return studyTasks[sampleIndex % studyTasks.length]?.task.title ?? 'Morning page';
}

function getPersonSample(
  board: FamilyBoardState,
  sampleIndex: number,
  fallbackName: string,
) {
  if (board.people.length === 0) {
    return fallbackName;
  }

  return board.people[sampleIndex % board.people.length]?.person.name ?? fallbackName;
}

function buildTypeStudies(board: FamilyBoardState): TypeStudy[] {
  return [
    {
      key: 'storybook',
      label: 'Storybook script',
      sampleName: getPersonSample(board, 0, 'Jess'),
      sampleTask: getTaskSample(board, 0),
      note: 'Handwritten headlines with soft serif notes for the room-scale glance.',
    },
    {
      key: 'letterpress',
      label: 'Letterpress serif',
      sampleName: getPersonSample(board, 1, 'Elizabeth'),
      sampleTask: getTaskSample(board, 1),
      note: 'A quieter book-page pairing with weight in the names, not the chrome.',
    },
    {
      key: 'field-notes',
      label: 'Field notes',
      sampleName: getPersonSample(board, 2, 'Micah'),
      sampleTask: getTaskSample(board, 2),
      note: 'Notebook energy: chalky labels, airy spacing, watercolor underlines.',
    },
  ];
}

function createPrototypeCompletion(task: TaskInstance, date: string) {
  return {
    id: `prototype-completion-${task.task.id}`,
    task_id: task.task.id,
    date,
    completed_at: `${date}T08:00:00.000Z`,
  };
}

function buildLegendStudyTasks(board: FamilyBoardState) {
  const studyTasks = board.people.flatMap((personState) => personState.tasks);
  const uncheckedStudyTask = studyTasks.find((task) => task.completion === null);
  const checkedStudyTask = studyTasks.find((task) => task.completion !== null);
  const baseStudyTask = uncheckedStudyTask ?? checkedStudyTask;

  if (!baseStudyTask) {
    return {
      uncheckedStudyTask: undefined,
      checkedStudyTask: undefined,
    };
  }

  return {
    uncheckedStudyTask: uncheckedStudyTask ?? {
      ...baseStudyTask,
      completion: null,
    },
    checkedStudyTask: checkedStudyTask ?? {
      ...baseStudyTask,
      completion: createPrototypeCompletion(baseStudyTask, board.day.date),
    },
  };
}

function PrototypeRing({
  completedCount,
  totalCount,
  tint,
  innerTint,
}: {
  completedCount: number;
  totalCount: number;
  tint: string;
  innerTint: string;
}) {
  const safeTotal = totalCount > 0 ? totalCount : 1;
  const ratio =
    totalCount > 0 ? Math.min(Math.max(completedCount / safeTotal, 0), 1) : 0;
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);
  const isComplete = totalCount > 0 && completedCount === totalCount;
  const gradientId = useId();
  const bloomId = useId();

  return (
    <div
      aria-label={`${completedCount} of ${totalCount} tasks complete`}
      className="prototype-ring"
    >
      <svg
        aria-hidden="true"
        className="-rotate-90 overflow-visible"
        height="96"
        viewBox="0 0 96 96"
        width="96"
      >
        <defs>
          <linearGradient id={gradientId} x1="8%" x2="92%" y1="16%" y2="88%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.7)" />
            <stop offset="58%" stopColor={tint} />
            <stop
              offset="100%"
              stopColor={
                isComplete
                  ? 'rgba(142, 157, 120, 0.9)'
                  : 'rgba(82, 122, 164, 0.9)'
              }
            />
          </linearGradient>
          <linearGradient id={bloomId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.38)" />
            <stop offset="100%" stopColor={innerTint} />
          </linearGradient>
        </defs>
        <circle
          cx="48"
          cy="48"
          fill="none"
          r={radius}
          stroke="rgba(88, 73, 59, 0.18)"
          strokeDasharray="2 10"
          strokeLinecap="round"
          strokeWidth="2.1"
        />
        <circle
          cx="48"
          cy="48"
          fill="none"
          r={radius}
          stroke={`url(#${bloomId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth="11"
        />
        <circle
          cx="48"
          cy="48"
          fill="none"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth="6.8"
        />
        <circle
          cx="48"
          cy="48"
          fill="none"
          r={radius + 1.5}
          stroke="rgba(255, 255, 255, 0.34)"
          strokeDasharray="12 18"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
      </svg>
      <div className="prototype-ring__core" />
    </div>
  );
}

function PrototypeCheckbox({
  isCompleted,
  tint,
}: {
  isCompleted: boolean;
  tint: string;
}) {
  return (
    <span aria-hidden="true" className="prototype-checkbox">
      <svg fill="none" height="28" viewBox="0 0 28 28" width="28">
        {isCompleted ? (
          <path
            d="M5.5 11.3C7.1 7.4 12.5 5.2 17.1 6.4C22.2 7.7 24.3 12.8 22.8 18.1C21.1 24.1 12.9 24.3 8.8 20.7C5.3 17.6 4 14.4 5.5 11.3Z"
            fill="rgba(143, 170, 197, 0.22)"
          />
        ) : null}
        <path
          d="M6 8.4C6.5 6.4 8.1 5.7 10.5 5.8H20.1C22.2 5.8 22.8 7 22.7 9.2L22.2 19.8C22.1 22.1 20.4 22.6 18.5 22.4L8.8 21.6C6.7 21.4 5.8 20.2 5.8 18.2L6 8.4Z"
          stroke="rgba(71, 58, 47, 0.76)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <path
          d="M6.9 7.5C8.2 6 10.4 6.2 12 6.1H19.4C21.1 6.2 22.2 6.8 22.1 8.7"
          stroke="rgba(71, 58, 47, 0.34)"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        {isCompleted ? (
          <>
            <path
              d="M7.8 14.8L12.2 19L21.3 9.2"
              stroke="rgba(255, 255, 255, 0.56)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4.6"
            />
            <path
              d="M7.8 14.8L12.2 19L21.3 9.2"
              stroke={tint}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3.1"
            />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function PrototypeTaskRow({
  task,
  tint,
}: {
  task: TaskInstance;
  tint: string;
}) {
  const isCompleted = task.completion !== null;

  return (
    <li
      className="prototype-task-row"
      data-completed={isCompleted ? 'true' : 'false'}
      style={{ '--prototype-row-wash': tint } as CSSProperties}
    >
      <PrototypeCheckbox isCompleted={isCompleted} tint={tint} />
      <span className="prototype-task-row__emoji">{task.task.emoji}</span>
      <span className="prototype-task-row__title">{task.task.title}</span>
    </li>
  );
}

function TypeStudyCard({ study }: { study: TypeStudy }) {
  return (
    <article
      className="prototype-type-study"
      data-testid="prototype-type-study"
    >
      <p className="prototype-type-study__label">{study.label}</p>
      <h3
        className={`prototype-type-study__sample prototype-type-study__sample--${study.key}`}
      >
        {study.sampleName}
      </h3>
      <p
        className={`prototype-type-study__task prototype-type-study__task--${study.key}`}
      >
        {study.sampleTask}
      </p>
      <p className="prototype-type-study__note">{study.note}</p>
    </article>
  );
}

function PrototypeColumn({
  personState,
  paletteIndex,
}: {
  personState: PersonDayState;
  paletteIndex: number;
}) {
  const palette = getPersonPalette(paletteIndex);
  const completedCount = getCompletedCount(personState);

  return (
    <article
      className="prototype-person-column"
      data-testid="prototype-person-column"
      style={
        {
          '--prototype-cloud': palette.cloud,
          '--prototype-ink': palette.ink,
          '--prototype-mist': palette.mist,
          '--prototype-wash': palette.wash,
        } as PrototypePaletteVars
      }
    >
      <div className="prototype-person-column__halo" />
      <div className="prototype-person-column__header">
        <div>
          <p className="prototype-person-column__streak">
            {personState.streak.current_count === 0
              ? 'Quiet start'
              : `${personState.streak.current_count} day thread`}
          </p>
          <h3 className="prototype-person-column__name">
            {personState.person.name}
          </h3>
        </div>
        <PrototypeRing
          completedCount={completedCount}
          innerTint={palette.mist}
          tint={palette.wash}
          totalCount={personState.tasks.length}
        />
      </div>

      <ul className="prototype-person-column__tasks">
        {personState.tasks.map((task) => (
          <PrototypeTaskRow
            key={task.task.id}
            task={task}
            tint={palette.wash}
          />
        ))}
        {personState.tasks.length === 0 ? (
          <li className="prototype-person-column__empty">No tasks today.</li>
        ) : null}
      </ul>
    </article>
  );
}

export function WatercolorPrototype({
  board,
  householdName,
}: WatercolorPrototypeProps) {
  const typeStudies = buildTypeStudies(board);
  const { checkedStudyTask, uncheckedStudyTask } = buildLegendStudyTasks(board);
  const studyTint = getPersonPalette(1).wash;

  return (
    <section className="prototype-sheet" data-testid="watercolor-prototype">
      <header className="prototype-sheet__header">
        <div className="prototype-sheet__copy">
          <p className="prototype-sheet__eyebrow">PROTO-001 watercolor study</p>
          <h1 className="prototype-sheet__title">
            Household art, not software
          </h1>
          <p className="prototype-sheet__lede">
            {householdName} on {formatDayLabel(board.day.date)}. This route
            studies quiet translucency, handwritten typography, sketched
            completion marks, and whether six columns can still feel airy on the
            counter.
          </p>
        </div>

        <aside className="prototype-sheet__legend">
          <p className="prototype-sheet__legend-title">Task wash study</p>
          <ul className="prototype-sheet__legend-list">
            {uncheckedStudyTask ? (
              <PrototypeTaskRow task={uncheckedStudyTask} tint={studyTint} />
            ) : null}
            {checkedStudyTask ? (
              <PrototypeTaskRow task={checkedStudyTask} tint={studyTint} />
            ) : null}
          </ul>
        </aside>
      </header>

      <section
        className="prototype-type-gallery"
        data-testid="prototype-type-gallery"
      >
        {typeStudies.map((study) => (
          <TypeStudyCard key={study.key} study={study} />
        ))}
      </section>

      <section
        className="prototype-dashboard-grid"
        data-testid="watercolor-prototype-dashboard"
      >
        {board.people.map((personState, index) => (
          <PrototypeColumn
            key={personState.person.id}
            paletteIndex={index}
            personState={personState}
          />
        ))}
      </section>
    </section>
  );
}
