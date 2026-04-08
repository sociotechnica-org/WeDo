import { beforeEach, describe, expect, it, vi } from 'vitest';

const realtimeServiceMocks = vi.hoisted(() => ({
  getFamilyBoardState: vi.fn(),
  toggleTaskCompletion: vi.fn(),
}));

vi.mock('@/services/family-board-service', () => ({
  FamilyBoardStateError: class extends Error {},
  getFamilyBoardState: realtimeServiceMocks.getFamilyBoardState,
  toggleTaskCompletion: realtimeServiceMocks.toggleTaskCompletion,
}));

import { FamilyBoard } from '@/realtime/family-board';

const { getFamilyBoardState, toggleTaskCompletion } = realtimeServiceMocks;

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
    getFamilyBoardState.mockReset();
    toggleTaskCompletion.mockReset();
    vi.useRealTimers();
  });

  it('responds to init with the current family board state', async () => {
    const ctx = new FakeDurableObjectState();
    const socket = new FakeWebSocket({ familyId: 'family-maple' });
    const room = new FamilyBoard(ctx as never, { DB: {} } as never);

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
