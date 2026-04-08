import { Hono } from 'hono';
import { getBoardResponse } from '@/services/board-service';
import type { WorkerBindings } from '@/config/runtime';
import { healthResponseSchema } from '@/types';

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

  return app;
}
