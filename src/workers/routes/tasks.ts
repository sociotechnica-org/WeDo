import type { Hono } from 'hono';
import { ZodError } from 'zod';
import { getAnthropicApiKey, type WorkerBindings } from '@/config/runtime';
import { NlTaskParserError, parseNaturalLanguageTask } from '@/services/nl-parser';
import {
  createTaskMutationSchema,
  createTaskResponseSchema,
  getFamilyRoomKey,
  nlTaskEntryRequestSchema,
} from '@/types';

type AppEnv = {
  Bindings: WorkerBindings;
};

export function registerTaskRoutes(app: Hono<AppEnv>) {
  app.post('/api/families/:familyId/tasks', async (context) => {
    try {
      const familyId = context.req.param('familyId');
      const requestBody = nlTaskEntryRequestSchema.parse(
        (await context.req.json()) as unknown,
      );
      const parsedTask = await parseNaturalLanguageTask(
        getAnthropicApiKey(context.env),
        requestBody.raw_input,
      );
      const mutation = createTaskMutationSchema.parse({
        person_id: requestBody.person_id,
        viewed_date: requestBody.viewed_date,
        task: parsedTask,
      });
      const stub = context.env.FAMILY_BOARD.getByName(getFamilyRoomKey(familyId));
      const response = await stub.fetch(
        new Request(`https://family-board.internal/tasks/${familyId}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(mutation),
        }),
      );

      if (!response.ok) {
        return context.text(await response.text(), response.status as 400 | 500);
      }

      return context.json(
        createTaskResponseSchema.parse((await response.json()) as unknown),
        201,
      );
    } catch (error) {
      if (error instanceof ZodError) {
        return context.text('Task request is invalid.', 400);
      }

      if (error instanceof NlTaskParserError) {
        return context.text(error.message, 502);
      }

      if (error instanceof Error) {
        return context.text(error.message, 503);
      }

      return context.text('Task creation failed.', 500);
    }
  });
}
