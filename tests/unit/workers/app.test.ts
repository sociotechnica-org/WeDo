import { beforeEach, describe, expect, it, vi } from 'vitest';

const taskRouteMocks = vi.hoisted(() => ({
  parseNaturalLanguageTask: vi.fn(),
}));

vi.mock('@/services/nl-parser', () => ({
  NlTaskParserError: class extends Error {},
  parseNaturalLanguageTask: taskRouteMocks.parseNaturalLanguageTask,
}));

import { createApp } from '@/workers/app';

describe('workers app realtime route', () => {
  beforeEach(() => {
    taskRouteMocks.parseNaturalLanguageTask.mockReset();
  });

  it('returns a controlled 503 when dashboard bootstrap cannot find a family', async () => {
    const app = createApp();

    const response = await app.fetch(
      new Request('https://example.com/api/board'),
      {
        DB: {
          prepare: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        },
        FAMILY_BOARD: {
          getByName: vi.fn(),
        },
        HOUSEHOLD_NAME: 'River House',
        TIMEZONE: 'America/New_York',
      } as never,
    );

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toContain(
      'No family is available to bootstrap the dashboard.',
    );
  });

  it('routes websocket requests to the family-scoped durable object instance', async () => {
    const getByName = vi.fn().mockReturnValue({
      fetch: vi.fn().mockResolvedValue(new Response('ok')),
    });
    const app = createApp();

    const response = await app.fetch(
      new Request('https://example.com/api/realtime/family-123', {
        headers: {
          Upgrade: 'websocket',
        },
      }),
      {
        DB: {} as never,
        FAMILY_BOARD: {
          getByName,
        },
      } as never,
    );

    expect(getByName).toHaveBeenCalledWith('family:family-123');
    expect(response.status).toBe(200);
  });

  it('rejects non-websocket requests to the realtime route', async () => {
    const app = createApp();

    const response = await app.fetch(
      new Request('https://example.com/api/realtime/family-123'),
      {
        DB: {} as never,
        FAMILY_BOARD: {
          getByName: vi.fn(),
        },
      } as never,
    );

    expect(response.status).toBe(426);
  });

  it('parses raw task entry input and forwards the structured mutation to the family durable object', async () => {
    taskRouteMocks.parseNaturalLanguageTask.mockResolvedValue({
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'TH', 'FR'],
      },
    });

    const durableObjectFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          task: {
            id: 'task-piano',
            family_id: 'family-123',
            person_id: 'person-456',
            title: 'Practice piano',
            emoji: '🎹',
            schedule_rules: {
              days: ['MO', 'TU', 'TH', 'FR'],
            },
            created_at: '2026-04-08T12:00:00Z',
          },
          state: {
            family_id: 'family-123',
            day: {
              date: '2026-04-08',
              is_sunday: false,
            },
            people: [
              {
                person: {
                  id: 'person-456',
                  family_id: 'family-123',
                  name: 'Micah',
                  display_order: 0,
                  emoji: '⚽',
                },
                streak: {
                  person_id: 'person-456',
                  current_count: 0,
                  best_count: 0,
                  last_qualifying_date: null,
                },
                skip_day: null,
                tasks: [
                  {
                    task: {
                      id: 'task-piano',
                      family_id: 'family-123',
                      person_id: 'person-456',
                      title: 'Practice piano',
                      emoji: '🎹',
                      schedule_rules: {
                        days: ['MO', 'TU', 'TH', 'FR'],
                      },
                      created_at: '2026-04-08T12:00:00Z',
                    },
                    completion: null,
                  },
                ],
              },
            ],
          },
        }),
        {
          status: 201,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );
    const app = createApp();

    const response = await app.fetch(
      new Request('https://example.com/api/families/family-123/tasks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          person_id: 'person-456',
          raw_input: 'practice piano Monday Tuesday Thursday Friday',
          viewed_date: '2026-04-08',
        }),
      }),
      {
        ANTHROPIC_API_KEY: 'test-api-key',
        DB: {} as never,
        FAMILY_BOARD: {
          getByName: vi.fn().mockReturnValue({
            fetch: durableObjectFetch,
          }),
        },
      } as never,
    );

    expect(response.status).toBe(201);
    expect(taskRouteMocks.parseNaturalLanguageTask).toHaveBeenCalledWith(
      'test-api-key',
      'practice piano Monday Tuesday Thursday Friday',
    );

    const forwardedRequest = durableObjectFetch.mock.calls[0]?.[0];

    expect(forwardedRequest).toBeInstanceOf(Request);
    expect(forwardedRequest?.url).toBe(
      'https://family-board.internal/tasks/family-123',
    );
    await expect((forwardedRequest as Request).json()).resolves.toEqual({
      person_id: 'person-456',
      viewed_date: '2026-04-08',
      task: {
        title: 'Practice piano',
        emoji: '🎹',
        schedule_rules: {
          days: ['MO', 'TU', 'TH', 'FR'],
        },
      },
    });
  });

  it('returns a controlled 503 when task creation hits an unexpected server error', async () => {
    taskRouteMocks.parseNaturalLanguageTask.mockRejectedValue(
      new Error('anthropic stack trace'),
    );
    const app = createApp();

    const response = await app.fetch(
      new Request('https://example.com/api/families/family-123/tasks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          person_id: 'person-456',
          raw_input: 'practice piano Monday Tuesday Thursday Friday',
          viewed_date: '2026-04-08',
        }),
      }),
      {
        ANTHROPIC_API_KEY: 'test-api-key',
        DB: {} as never,
        FAMILY_BOARD: {
          getByName: vi.fn(),
        },
      } as never,
    );

    expect(response.status).toBe(503);
    await expect(response.text()).resolves.toBe(
      'Task creation is temporarily unavailable.',
    );
  });
});
