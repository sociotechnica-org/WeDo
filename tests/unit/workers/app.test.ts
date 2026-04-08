import { describe, expect, it, vi } from 'vitest';
import { createApp } from '@/workers/app';

describe('workers app realtime route', () => {
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
});
