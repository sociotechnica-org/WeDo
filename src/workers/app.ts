import { Hono } from 'hono';
import { getBoardResponse } from '@/services/board-service';
import type { WorkerBindings } from '@/config/runtime';
import { getFamilyRoomKey, healthResponseSchema } from '@/types';

type AppEnv = {
  Bindings: WorkerBindings;
};

export function createApp() {
  const app = new Hono<AppEnv>();

  app.get('/api/health', (context) => {
    return context.json(
      healthResponseSchema.parse({
        ok: true,
        service: 'we-do',
      }),
    );
  });

  app.get('/api/board', (context) => {
    return context.json(getBoardResponse(context.env));
  });

  app.get('/api/realtime/:familyId', async (context) => {
    const upgradeHeader = context.req.header('Upgrade');

    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('Expected websocket upgrade.', { status: 426 });
    }

    const familyId = context.req.param('familyId');
    const stub = context.env.FAMILY_BOARD.getByName(getFamilyRoomKey(familyId));

    return await stub.fetch(context.req.raw);
  });

  return app;
}
