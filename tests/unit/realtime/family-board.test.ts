import { beforeEach, describe, expect, it, vi } from 'vitest';

const realtimeServiceMocks = vi.hoisted(() => ({
  createRecurringTask: vi.fn(),
  getFamilyBoardState: vi.fn(),
  toggleSkipDay: vi.fn(),
  toggleTaskCompletion: vi.fn(),
}));

vi.mock('@/services/family-board-service', () => ({
  FamilyBoardStateError: class extends Error {},
  createRecurringTask: realtimeServiceMocks.createRecurringTask,
  getFamilyBoardState: realtimeServiceMocks.getFamilyBoardState,
  toggleSkipDay: realtimeServiceMocks.toggleSkipDay,
  toggleTaskCompletion: realtimeServiceMocks.toggleTaskCompletion,
}));

import { FamilyBoard } from '@/realtime/family-board';

const {
  createRecurringTask,
  getFamilyBoardState,
  toggleSkipDay,
  toggleTaskCompletion,
} = realtimeServiceMocks;

class FakeWebSocket {
  attachment: unknown;
  sent: string[] = [];
  closed:
    | {
        code: number;
        reason: string;
      }
    | undefined;

  constructor(attachment: unknown) {
    this.attachment = attachment;
  }

  close(code?: number, reason?: string): void {
    this.closed = {
      code: code ?? 1000,
      reason: reason ?? '',
    };
  }

  deserializeAttachment(): unknown {
    return this.attachment;
  }

  send(message: string): void {
    this.sent.push(message);
  }

  serializeAttachment(value: unknown): void {
    this.attachment = value;
  }
}

class FakeDurableObjectState {
  sockets: FakeWebSocket[] = [];

  acceptWebSocket(socket: FakeWebSocket): void {
    this.sockets.push(socket);
  }

  getWebSockets(): WebSocket[] {
    return this.sockets as unknown as WebSocket[];
  }
}

const exampleState = {
  family_id: 'family-maple',
  day: {
    date: '2026-04-07',
    is_sunday: false,
  },
  people: [
    {
      person: {
        id: 'person-jess',
        family_id: 'family-maple',
        name: 'Jess',
        display_order: 0,
        emoji: '🌿',
      },
      streak: {
        person_id: 'person-jess',
        current_count: 3,
        best_count: 8,
        last_qualifying_date: '2026-04-06',
      },
      skip_day: null,
      tasks: [],
    },
  ],
};

describe('FamilyBoard durable object', () => {
  beforeEach(() => {
    createRecurringTask.mockReset();
    getFamilyBoardState.mockReset();
    toggleSkipDay.mockReset();
    toggleTaskCompletion.mockReset();
    vi.useRealTimers();
  });

  it('responds to init with the current family board state', async () => {
    const ctx = new FakeDurableObjectState();
    const socket = new FakeWebSocket({ familyId: 'family-maple' });
    const room = new FamilyBoard(
      ctx as never,
      {
        DB: {} as never,
        TIMEZONE: 'America/New_York',
      } as never,
    );

    getFamilyBoardState.mockResolvedValue(exampleState);

    await room.webSocketMessage(
      socket as unknown as WebSocket,
      JSON.stringify({
        type: 'init',
        date: '2026-04-07',
      }),
    );

    expect(getFamilyBoardState).toHaveBeenCalledWith(
      {},
      'family-maple',
      '2026-04-07',
    );
    expect(socket.attachment).toEqual({
      familyId: 'family-maple',
      date: '2026-04-07',
    });
    expect(socket.sent).toHaveLength(1);
    expect(JSON.parse(socket.sent[0] ?? '{}')).toEqual({
      type: 'init_response',
      state: exampleState,
    });
  });

  it('clamps init requests beyond tomorrow to the resolved board date', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T14:15:00Z'));

    const ctx = new FakeDurableObjectState();
    const socket = new FakeWebSocket({ familyId: 'family-maple' });
    const room = new FamilyBoard(
      ctx as never,
      {
        DB: {} as never,
        TIMEZONE: 'America/New_York',
      } as never,
    );

    getFamilyBoardState.mockResolvedValue(exampleState);

    await room.webSocketMessage(
      socket as unknown as WebSocket,
      JSON.stringify({
        type: 'init',
        date: '2026-04-15',
      }),
    );

    expect(getFamilyBoardState).toHaveBeenCalledWith(
      {},
      'family-maple',
      '2026-04-09',
    );
    expect(socket.attachment).toEqual({
      familyId: 'family-maple',
      date: '2026-04-09',
    });
  });

  it('creates a task through the durable object and broadcasts updated state to each viewed day', async () => {
    const ctx = new FakeDurableObjectState();
    const todaySocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-08',
    });
    const tomorrowSocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-09',
    });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

    ctx.acceptWebSocket(todaySocket);
    ctx.acceptWebSocket(tomorrowSocket);
    createRecurringTask.mockResolvedValue({
      id: 'task-piano',
      family_id: 'family-maple',
      person_id: 'person-jess',
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'TH', 'FR'],
      },
      created_at: '2026-04-08T10:00:00Z',
    });
    getFamilyBoardState.mockImplementation(
      async (_db: unknown, _familyId: string, date: string) => ({
        ...exampleState,
        day: {
          date,
          is_sunday: false,
        },
      }),
    );

    const response = await room.fetch(
      new Request('https://example.com/tasks/family-maple', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
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
      }),
    );

    expect(response.status).toBe(201);
    expect(createRecurringTask).toHaveBeenCalledWith(
      {},
      {
        familyId: 'family-maple',
        personId: 'person-jess',
        title: 'Practice piano',
        emoji: '🎹',
        scheduleRules: {
          days: ['MO', 'TU', 'TH', 'FR'],
        },
      },
    );
    expect(getFamilyBoardState).toHaveBeenNthCalledWith(
      1,
      {},
      'family-maple',
      '2026-04-08',
    );
    expect(getFamilyBoardState).toHaveBeenNthCalledWith(
      2,
      {},
      'family-maple',
      '2026-04-09',
    );

    expect(JSON.parse(todaySocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: {
        ...exampleState,
        day: {
          date: '2026-04-08',
          is_sunday: false,
        },
      },
    });
    expect(JSON.parse(tomorrowSocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: {
        ...exampleState,
        day: {
          date: '2026-04-09',
          is_sunday: false,
        },
      },
    });
  });

  it('toggles a skip day and broadcasts refreshed state to every viewed date', async () => {
    const ctx = new FakeDurableObjectState();
    const skippedDateSocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-07',
    });
    const todaySocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-08',
    });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

    ctx.acceptWebSocket(skippedDateSocket);
    ctx.acceptWebSocket(todaySocket);
    getFamilyBoardState.mockImplementation(
      async (_db: unknown, _familyId: string, date: string) => ({
        ...exampleState,
        day: {
          date,
          is_sunday: false,
        },
        people: exampleState.people.map((personState) => ({
          ...personState,
          skip_day:
            date === '2026-04-07'
              ? {
                  id: 'skip-2026-04-07',
                  family_id: 'family-maple',
                  date,
                  reason: null,
                  created_at: '2026-04-08T12:00:00Z',
                }
              : null,
        })),
      }),
    );

    await room.webSocketMessage(
      skippedDateSocket as unknown as WebSocket,
      JSON.stringify({
        type: 'skip_day_toggled',
        date: '2026-04-07',
        skipped: true,
      }),
    );

    expect(toggleSkipDay).toHaveBeenCalledWith(
      {},
      {
        familyId: 'family-maple',
        date: '2026-04-07',
        skipped: true,
      },
    );
    expect(getFamilyBoardState).toHaveBeenNthCalledWith(
      1,
      {},
      'family-maple',
      '2026-04-07',
    );
    expect(getFamilyBoardState).toHaveBeenNthCalledWith(
      2,
      {},
      'family-maple',
      '2026-04-08',
    );
    expect(JSON.parse(skippedDateSocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: {
        ...exampleState,
        day: {
          date: '2026-04-07',
          is_sunday: false,
        },
        people: exampleState.people.map((personState) => ({
          ...personState,
          skip_day: {
            id: 'skip-2026-04-07',
            family_id: 'family-maple',
            date: '2026-04-07',
            reason: null,
            created_at: '2026-04-08T12:00:00Z',
          },
        })),
      },
    });
    expect(JSON.parse(todaySocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: {
        ...exampleState,
        day: {
          date: '2026-04-08',
          is_sunday: false,
        },
      },
    });
  });

  it('returns success after a task write even if a secondary viewed-date refresh fails', async () => {
    const ctx = new FakeDurableObjectState();
    const todaySocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-08',
    });
    const tomorrowSocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-09',
    });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

    ctx.acceptWebSocket(todaySocket);
    ctx.acceptWebSocket(tomorrowSocket);
    createRecurringTask.mockResolvedValue({
      id: 'task-piano',
      family_id: 'family-maple',
      person_id: 'person-jess',
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'TH', 'FR'],
      },
      created_at: '2026-04-08T10:00:00Z',
    });
    getFamilyBoardState.mockImplementation(
      async (_db: unknown, _familyId: string, date: string) => {
        if (date === '2026-04-09') {
          throw new Error('Secondary board refresh failed.');
        }

        return {
          ...exampleState,
          day: {
            date,
            is_sunday: false,
          },
        };
      },
    );

    const response = await room.fetch(
      new Request('https://example.com/tasks/family-maple', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
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
      }),
    );

    expect(response.status).toBe(201);
    expect(todaySocket.sent).toHaveLength(1);
    expect(tomorrowSocket.sent).toHaveLength(0);
  });

  it('persists a toggle and broadcasts the resulting state update to connected clients', async () => {
    const ctx = new FakeDurableObjectState();
    const firstSocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-07',
    });
    const secondSocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-07',
    });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

    ctx.acceptWebSocket(firstSocket);
    ctx.acceptWebSocket(secondSocket);
    toggleTaskCompletion.mockResolvedValue(undefined);
    getFamilyBoardState.mockResolvedValue(exampleState);

    await room.webSocketMessage(
      firstSocket as unknown as WebSocket,
      JSON.stringify({
        type: 'task_toggled',
        date: '2026-04-07',
        task_id: 'task-piano',
        completed: true,
      }),
    );

    expect(toggleTaskCompletion).toHaveBeenCalledWith(
      {},
      {
        familyId: 'family-maple',
        taskId: 'task-piano',
        date: '2026-04-07',
        completed: true,
      },
    );
    expect(getFamilyBoardState).toHaveBeenCalledWith(
      {},
      'family-maple',
      '2026-04-07',
    );
    expect(JSON.parse(firstSocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: exampleState,
    });
    expect(JSON.parse(secondSocket.sent[0] ?? '{}')).toEqual({
      type: 'state_update',
      state: exampleState,
    });
  });

  it('does not broadcast a day update to sockets viewing a different date', async () => {
    const ctx = new FakeDurableObjectState();
    const todaySocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-07',
    });
    const yesterdaySocket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-06',
    });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

    ctx.acceptWebSocket(todaySocket);
    ctx.acceptWebSocket(yesterdaySocket);
    toggleTaskCompletion.mockResolvedValue(undefined);
    getFamilyBoardState.mockResolvedValue(exampleState);

    await room.webSocketMessage(
      todaySocket as unknown as WebSocket,
      JSON.stringify({
        type: 'task_toggled',
        date: '2026-04-07',
        task_id: 'task-piano',
        completed: true,
      }),
    );

    expect(todaySocket.sent).toHaveLength(1);
    expect(yesterdaySocket.sent).toHaveLength(0);
  });

  it('rejects realtime toggles beyond tomorrow before mutating state', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-08T14:15:00Z'));

    const room = new FamilyBoard(
      new FakeDurableObjectState() as never,
      {
        DB: {} as never,
        TIMEZONE: 'America/New_York',
      } as never,
    );
    const socket = new FakeWebSocket({
      familyId: 'family-maple',
      date: '2026-04-09',
    });

    await room.webSocketMessage(
      socket as unknown as WebSocket,
      JSON.stringify({
        type: 'task_toggled',
        date: '2026-04-15',
        task_id: 'task-piano',
        completed: true,
      }),
    );

    expect(toggleTaskCompletion).not.toHaveBeenCalled();
    expect(getFamilyBoardState).not.toHaveBeenCalled();
    expect(socket.closed).toEqual({
      code: 1008,
      reason: 'Realtime requests cannot target a day beyond tomorrow.',
    });
  });

  it('closes the socket on malformed client messages', async () => {
    const room = new FamilyBoard(
      new FakeDurableObjectState() as never,
      { DB: {} } as never,
    );
    const socket = new FakeWebSocket({ familyId: 'family-maple' });

    await room.webSocketMessage(socket as unknown as WebSocket, '{not-json');

    expect(socket.closed).toEqual({
      code: 1008,
      reason: 'Unexpected realtime error.',
    });
  });
});
