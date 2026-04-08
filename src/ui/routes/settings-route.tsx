import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  personSettingsEntrySchema,
  savePersonsRequestSchema,
} from '@/types';
import { RealtimeStatusBanner } from '@/ui/components/realtime-status-banner';
import { buildDayHref } from '@/ui/lib/day-navigation';
import { formatDayLabel } from '@/ui/lib/format-day-label';
import { useReadyBoard } from '@/ui/routes/use-ready-board';

type PersonDraftRow = {
  localId: string;
  id?: string;
  name: string;
  emoji: string;
};

function createDraftRows(
  people: ReturnType<typeof useReadyBoard>['board']['people'],
): PersonDraftRow[] {
  return people.map((personState) => ({
    localId: personState.person.id,
    id: personState.person.id,
    name: personState.person.name,
    emoji: personState.person.emoji,
  }));
}

function getIssueMessage(error: {
  issues?: Array<{
    message: string;
  }>;
}): string {
  return error.issues?.[0]?.message ?? 'Review the person list and try again.';
}

export function SettingsRoute() {
  const { board, householdName, realtime, savePersons, todayDate } =
    useReadyBoard();
  const navigate = useNavigate();
  const dashboardHref = buildDayHref('/', board.day.date, todayDate);
  const [draftRows, setDraftRows] = useState(() => createDraftRows(board.people));
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateDraftRow(
    localId: string,
    field: 'name' | 'emoji',
    value: string,
  ) {
    setDraftRows((currentRows) =>
      currentRows.map((row) =>
        row.localId === localId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
    setErrorMessage(null);
  }

  function moveDraftRow(localId: string, direction: -1 | 1) {
    setDraftRows((currentRows) => {
      const currentIndex = currentRows.findIndex((row) => row.localId === localId);

      if (currentIndex < 0) {
        return currentRows;
      }

      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= currentRows.length) {
        return currentRows;
      }

      const nextRows = [...currentRows];
      const currentRow = nextRows[currentIndex];
      const nextRow = nextRows[nextIndex];

      if (!currentRow || !nextRow) {
        return currentRows;
      }

      nextRows[currentIndex] = nextRow;
      nextRows[nextIndex] = currentRow;

      return nextRows;
    });
    setConfirmingRemovalId(null);
    setErrorMessage(null);
  }

  function handleAddPerson() {
    const parsed = personSettingsEntrySchema.safeParse({
      name: newName,
      emoji: newEmoji,
    });

    if (!parsed.success) {
      setErrorMessage(getIssueMessage(parsed.error));
      return;
    }

    setDraftRows((currentRows) => [
      ...currentRows,
      {
        localId: crypto.randomUUID(),
        ...parsed.data,
      },
    ]);
    setNewName('');
    setNewEmoji('');
    setConfirmingRemovalId(null);
    setErrorMessage(null);
    setNoticeMessage('Person added to the draft list. Save to update the board.');
  }

  function handleRemovePerson(localId: string) {
    if (draftRows.length === 1) {
      setErrorMessage('At least one Person must remain on the board.');
      return;
    }

    setDraftRows((currentRows) =>
      currentRows.filter((row) => row.localId !== localId),
    );
    setConfirmingRemovalId(null);
    setErrorMessage(null);
    setNoticeMessage(
      'Person removed from the draft list. Save to update the board.',
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNoticeMessage(null);

    const parsed = savePersonsRequestSchema.safeParse({
      viewed_date: board.day.date,
      people: draftRows.map((row) => ({
        id: row.id,
        name: row.name,
        emoji: row.emoji,
      })),
    });

    if (!parsed.success) {
      setErrorMessage(getIssueMessage(parsed.error));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await savePersons(parsed.data.people);
      await navigate(dashboardHref);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Saving person settings failed.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="paper-canvas min-h-screen px-4 py-5 sm:px-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[78rem] flex-col gap-6">
        <header className="paper-sheet rounded-[2.8rem] border border-[rgba(107,90,75,0.08)] px-5 py-5 md:px-7 md:py-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.38em] text-[var(--color-ink-soft)]">
                Shared family board
              </p>
              <h1 className="hand-title mt-2 text-[4.6rem] leading-[0.88] text-[var(--color-ink)] lg:text-[5.4rem]">
                WeDo
              </h1>
              <p className="mt-3 text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
                {householdName} for {formatDayLabel(board.day.date)}.
              </p>
              <Link
                className="stationery-link mt-4 px-5 py-2.5 text-[1.1rem]"
                to={dashboardHref}
              >
                Back to dashboard
              </Link>
            </div>

            <div className="justify-self-start md:justify-self-end">
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
                Settings
              </p>
              <h2 className="hand-title mt-3 text-[3.2rem] leading-[0.9] text-[var(--color-ink)]">
                Person management
              </h2>
              <p className="mt-3 max-w-md text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
                Adjust who appears on the board and the order of the household
                columns.
              </p>
            </div>
          </div>
        </header>

        {realtime.status === 'degraded' ? (
          <RealtimeStatusBanner message={realtime.message} />
        ) : null}

        <form
          className="paper-sheet rounded-[3rem] border border-[rgba(107,90,75,0.08)] px-5 py-6 md:px-7 md:py-8"
          onSubmit={(event) => {
            void handleSave(event);
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="scribe-label text-[0.68rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
                People on the board
              </p>
              <p className="mt-2 max-w-2xl text-[0.98rem] leading-6 text-[var(--color-ink-soft)]">
                Removing a Person also removes their tasks, completions, and
                streak row from durable storage.
              </p>
            </div>
            <p className="text-[0.96rem] text-[var(--color-ink-soft)]">
              {draftRows.length} people in this draft
            </p>
          </div>

          <ol className="mt-6 space-y-4" data-testid="settings-person-list">
            {draftRows.map((row, index) => {
              const isConfirmingRemoval = confirmingRemovalId === row.localId;
              const isOnlyPerson = draftRows.length === 1;

              return (
                <li
                  className="paper-panel rounded-[1.9rem] border border-[rgba(107,90,75,0.1)] px-4 py-4"
                  data-testid="settings-person-row"
                  key={row.localId}
                >
                  <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                    <div className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                      <span className="scribe-label text-[0.66rem] uppercase tracking-[0.22em]">
                        {index + 1}
                      </span>
                      <div className="flex flex-col gap-2">
                        <button
                          aria-label={`Move ${row.name || 'Person'} up`}
                          className="stationery-button stationery-button--quiet rounded-[1rem] px-3 py-2 text-[1rem] text-[var(--color-ink-soft)] disabled:opacity-35"
                          disabled={index === 0 || isSaving}
                          onClick={() => {
                            moveDraftRow(row.localId, -1);
                          }}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label={`Move ${row.name || 'Person'} down`}
                          className="stationery-button stationery-button--quiet rounded-[1rem] px-3 py-2 text-[1rem] text-[var(--color-ink-soft)] disabled:opacity-35"
                          disabled={index === draftRows.length - 1 || isSaving}
                          onClick={() => {
                            moveDraftRow(row.localId, 1);
                          }}
                          type="button"
                        >
                          ↓
                        </button>
                      </div>
                    </div>

                    <label className="block">
                      <span className="scribe-label text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                        Emoji
                      </span>
                      <input
                        className="stationery-input mt-2 px-3 py-3 text-[1.15rem]"
                        disabled={isSaving}
                        onChange={(event) => {
                          updateDraftRow(row.localId, 'emoji', event.target.value);
                        }}
                        value={row.emoji}
                      />
                    </label>

                    <label className="block">
                      <span className="scribe-label text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                        Name
                      </span>
                      <input
                        className="stationery-input mt-2 px-4 py-3 text-[1.02rem]"
                        disabled={isSaving}
                        onChange={(event) => {
                          updateDraftRow(row.localId, 'name', event.target.value);
                        }}
                        value={row.name}
                      />
                    </label>

                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      {isConfirmingRemoval ? (
                        <>
                          <button
                            className="stationery-button stationery-button--muted px-4 py-2.5 text-[1rem]"
                            disabled={isSaving}
                            onClick={() => {
                              setConfirmingRemovalId(null);
                            }}
                            type="button"
                          >
                            Keep
                          </button>
                          <button
                            className="stationery-button px-4 py-2.5 text-[1rem]"
                            disabled={isSaving}
                            onClick={() => {
                              handleRemovePerson(row.localId);
                            }}
                            type="button"
                          >
                            Confirm remove
                          </button>
                        </>
                      ) : (
                        <button
                          className="stationery-button stationery-button--muted px-4 py-2.5 text-[1rem] disabled:opacity-35"
                          disabled={isOnlyPerson || isSaving}
                          onClick={() => {
                            setConfirmingRemovalId(row.localId);
                            setNoticeMessage(null);
                          }}
                          type="button"
                        >
                          {isOnlyPerson ? 'Keep one Person' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <section className="paper-panel mt-8 rounded-[2.1rem] border border-dashed border-[rgba(107,90,75,0.12)] bg-[rgba(250,246,240,0.68)] px-4 py-5 md:px-5">
            <p className="scribe-label text-[0.68rem] uppercase tracking-[0.32em] text-[var(--color-ink-soft)]">
              Add a Person
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)_auto] md:items-end">
              <label className="block">
                <span className="scribe-label text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  Emoji
                </span>
                <input
                  className="stationery-input mt-2 px-3 py-3 text-[1.15rem]"
                  disabled={isSaving}
                  onChange={(event) => {
                    setNewEmoji(event.target.value);
                  }}
                  placeholder="🌼"
                  value={newEmoji}
                />
              </label>
              <label className="block">
                <span className="scribe-label text-[0.62rem] uppercase tracking-[0.22em] text-[var(--color-ink-soft)]">
                  Name
                </span>
                <input
                  className="stationery-input mt-2 px-4 py-3 text-[1.02rem]"
                  disabled={isSaving}
                  onChange={(event) => {
                    setNewName(event.target.value);
                  }}
                  placeholder="New Person"
                  value={newName}
                />
              </label>
              <button
                className="stationery-button px-5 py-3 text-[1.05rem] disabled:opacity-60"
                disabled={isSaving}
                onClick={handleAddPerson}
                type="button"
              >
                Add Person
              </button>
            </div>
          </section>

          {errorMessage ? (
            <p className="mt-5 text-[0.96rem] text-[var(--color-ink-soft)]">
              {errorMessage}
            </p>
          ) : null}
          {noticeMessage ? (
            <p className="mt-5 text-[0.96rem] text-[var(--color-ink-soft)]">
              {noticeMessage}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <Link
              className="stationery-link stationery-link--muted px-5 py-3 text-[1.05rem]"
              to={dashboardHref}
            >
              Cancel
            </Link>
            <button
              className="stationery-button px-5 py-3 text-[1.05rem] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
