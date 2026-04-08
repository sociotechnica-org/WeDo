import { describe, expect, it } from 'vitest';
import { getRuntimeConfig } from '@/config/runtime';
import {
  boardRequestQuerySchema,
  boardResponseSchema,
  clientWebSocketMessageSchema,
  createTaskMutationSchema,
  createTaskResponseSchema,
  dayCodeSchema,
  familyBoardStateSchema,
  initResponseSchema,
  nlTaskEntryRequestSchema,
  parsedTaskSchema,
  personSchema,
  scheduleRulesSchema,
  serverWebSocketMessageSchema,
  skipDaySchema,
  skipDayToggledMessageSchema,
  stateUpdateMessageSchema,
  streakSchema,
  taskCompletionSchema,
  taskSchema,
  taskToggledMessageSchema,
  webSocketMessageSchema,
  defaultTimezone,
} from '@/types';

const examplePerson = {
  id: 'person-jess',
  family_id: 'family-maple',
  name: 'Jess',
  display_order: 0,
  emoji: '🌿',
};

const exampleTask = {
  id: 'task-piano',
  family_id: 'family-maple',
  person_id: 'person-jess',
  title: 'Practice piano',
  emoji: '🎹',
  schedule_rules: {
    days: ['MO', 'TU', 'TH', 'FR'],
  },
  created_at: '2026-04-07T08:15:00Z',
};

const exampleCompletion = {
  id: 'completion-piano',
  task_id: 'task-piano',
  date: '2026-04-07',
  completed_at: '2026-04-07T18:45:00Z',
};

const exampleSkipDay = {
  id: 'skip-2026-04-07',
  family_id: 'family-maple',
  date: '2026-04-07',
  reason: 'Travel day',
  created_at: '2026-04-07T07:00:00Z',
};

const exampleSkipDayWithoutReason = {
  ...exampleSkipDay,
  reason: null,
};

const exampleStreak = {
  person_id: 'person-jess',
  current_count: 4,
  best_count: 9,
  last_qualifying_date: '2026-04-06',
};

const exampleFamilyBoardState = {
  family_id: 'family-maple',
  day: {
    date: '2026-04-07',
    is_sunday: false,
  },
  people: [
    {
      person: examplePerson,
      streak: exampleStreak,
      skip_day: null,
      tasks: [
        {
          task: exampleTask,
          completion: exampleCompletion,
        },
      ],
    },
  ],
};

describe('shared type contracts', () => {
  it('accepts valid primitive records', () => {
    expect(personSchema.parse(examplePerson)).toEqual(examplePerson);
    expect(taskSchema.parse(exampleTask)).toEqual(exampleTask);
    expect(taskCompletionSchema.parse(exampleCompletion)).toEqual(
      exampleCompletion,
    );
    expect(skipDaySchema.parse(exampleSkipDay)).toEqual(exampleSkipDay);
    expect(skipDaySchema.parse(exampleSkipDayWithoutReason)).toEqual(
      exampleSkipDayWithoutReason,
    );
    expect(streakSchema.parse(exampleStreak)).toEqual(exampleStreak);
    expect(familyBoardStateSchema.parse(exampleFamilyBoardState)).toEqual(
      exampleFamilyBoardState,
    );
    expect(
      boardResponseSchema.parse({
        board: {
          familyId: 'family-maple',
          householdName: 'Maple House',
          date: '2026-04-07',
          todayDate: '2026-04-08',
        },
      }),
    ).toEqual({
      board: {
        familyId: 'family-maple',
        householdName: 'Maple House',
        date: '2026-04-07',
        todayDate: '2026-04-08',
      },
    });
    expect(
      parsedTaskSchema.parse({
        title: 'Practice piano',
        emoji: '🎹',
        schedule_rules: {
          days: ['MO', 'TU', 'TH', 'FR'],
        },
      }),
    ).toEqual({
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'TH', 'FR'],
      },
    });
  });

  it('normalizes invalid board query day values to an omitted day override', () => {
    expect(
      boardRequestQuerySchema.parse({
        day: 'not-a-date',
      }),
    ).toEqual({
      day: undefined,
    });

    expect(
      boardRequestQuerySchema.parse({
        day: '2026-13-45',
      }),
    ).toEqual({
      day: undefined,
    });
  });

  it('accepts valid schedule rules and RFC 5545 day codes', () => {
    const parsedRules = scheduleRulesSchema.parse({
      days: ['MO', 'WE', 'FR'],
    });

    expect(parsedRules.days).toEqual(['MO', 'WE', 'FR']);
    expect(dayCodeSchema.parse('SU')).toBe('SU');
  });

  it('accepts valid natural-language task entry contracts', () => {
    expect(
      nlTaskEntryRequestSchema.parse({
        person_id: 'person-jess',
        raw_input: ' practice piano weekdays ',
        viewed_date: '2026-04-08',
      }),
    ).toEqual({
      person_id: 'person-jess',
      raw_input: 'practice piano weekdays',
      viewed_date: '2026-04-08',
    });

    expect(
      createTaskMutationSchema.parse({
        person_id: 'person-jess',
        viewed_date: '2026-04-08',
        task: {
          title: 'Practice piano',
          emoji: '🎹',
          schedule_rules: {
            days: ['MO', 'TU', 'TH', 'FR'],
          },
        },
      }),
    ).toEqual({
      person_id: 'person-jess',
      viewed_date: '2026-04-08',
      task: {
        title: 'Practice piano',
        emoji: '🎹',
        schedule_rules: {
          days: ['MO', 'TU', 'TH', 'FR'],
        },
      },
    });

    expect(
      createTaskResponseSchema.parse({
        task: exampleTask,
        state: exampleFamilyBoardState,
      }),
    ).toEqual({
      task: exampleTask,
      state: exampleFamilyBoardState,
    });
  });

  it('rejects invalid schedule rules', () => {
    expect(
      scheduleRulesSchema.safeParse({
        days: [],
      }).success,
    ).toBe(false);

    expect(
      scheduleRulesSchema.safeParse({
        days: ['MO', 'MONDAY'],
      }).success,
    ).toBe(false);

    expect(
      scheduleRulesSchema.safeParse({
        days: ['MO', 'MO'],
      }).success,
    ).toBe(false);
  });

  it('rejects identifiers with leading or trailing whitespace', () => {
    expect(
      personSchema.safeParse({
        ...examplePerson,
        id: ' person-jess ',
      }).success,
    ).toBe(false);

    expect(
      taskToggledMessageSchema.safeParse({
        type: 'task_toggled',
        date: '2026-04-07',
        task_id: ' task-piano ',
        completed: true,
      }).success,
    ).toBe(false);
  });

  it('accepts websocket protocol messages across the discriminated unions', () => {
    const initRequest = {
      type: 'init',
      date: '2026-04-07',
    } as const;

    const initResponse = {
      type: 'init_response',
      state: exampleFamilyBoardState,
    } as const;

    const taskToggled = {
      type: 'task_toggled',
      date: '2026-04-07',
      task_id: 'task-piano',
      completed: true,
    } as const;
    const skipDayToggled = {
      type: 'skip_day_toggled',
      date: '2026-04-07',
      skipped: true,
    } as const;

    const stateUpdate = {
      type: 'state_update',
      state: exampleFamilyBoardState,
    } as const;

    expect(clientWebSocketMessageSchema.parse(initRequest)).toEqual(
      initRequest,
    );
    expect(clientWebSocketMessageSchema.parse(taskToggled)).toEqual(
      taskToggled,
    );
    expect(webSocketMessageSchema.parse(taskToggled)).toEqual(taskToggled);
    expect(skipDayToggledMessageSchema.parse(skipDayToggled)).toEqual(
      skipDayToggled,
    );
    expect(clientWebSocketMessageSchema.parse(skipDayToggled)).toEqual(
      skipDayToggled,
    );
    expect(webSocketMessageSchema.parse(skipDayToggled)).toEqual(
      skipDayToggled,
    );
    expect(initResponseSchema.parse(initResponse)).toEqual(initResponse);
    expect(serverWebSocketMessageSchema.parse(initResponse)).toEqual(
      initResponse,
    );
    expect(stateUpdateMessageSchema.parse(stateUpdate)).toEqual(stateUpdate);
    expect(serverWebSocketMessageSchema.parse(stateUpdate)).toEqual(
      stateUpdate,
    );
  });

  it('rejects unknown or directionally invalid websocket messages', () => {
    expect(
      webSocketMessageSchema.safeParse({
        type: 'unknown',
        date: '2026-04-07',
      }).success,
    ).toBe(false);

    expect(
      clientWebSocketMessageSchema.safeParse({
        type: 'init_response',
        state: exampleFamilyBoardState,
      }).success,
    ).toBe(false);

    expect(
      clientWebSocketMessageSchema.safeParse({
        type: 'task_deleted',
        date: '2026-04-07',
        task_id: 'task-piano',
      }).success,
    ).toBe(false);

    expect(
      serverWebSocketMessageSchema.safeParse({
        type: 'skip_day_toggled',
        date: '2026-04-07',
        skipped: true,
      }).success,
    ).toBe(false);

    expect(
      taskToggledMessageSchema.safeParse({
        type: 'task_toggled',
        date: '2026-04-07',
        task_id: '',
        completed: true,
      }).success,
    ).toBe(false);
  });

  it('defaults the timezone anchor to America/New_York', () => {
    expect(getRuntimeConfig({}).timezone).toBe(defaultTimezone);
    expect(
      getRuntimeConfig({
        TIMEZONE: 'America/New_York',
      }).timezone,
    ).toBe(defaultTimezone);
  });
});
