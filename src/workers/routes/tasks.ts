import type { Hono } from 'hono';
import { ZodError } from 'zod';
import { getTaskParserConfig, type WorkerBindings } from '@/config/runtime';
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

const unexpectedTaskCreationMessage =
  'Task creation is temporarily unavailable.';

export function registerTaskRoutes(app: Hono<AppEnv>) {
  app.post('/api/families/:familyId/tasks', async (context) => {
    try {
      const familyId = context.req.param('familyId');
      const requestBody = nlTaskEntryRequestSchema.parse(
        (await context.req.json()) as unknown,
      );
      const requestedTaskParserMode =
        context.req.header('x-wedo-task-parser-mode') === 'stub'
          ? 'stub'
          : undefined;
      const parsedTask = await parseNaturalLanguageTask(
        getTaskParserConfig(context.env, requestedTaskParserMode),
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
        if (response.status >= 500) {
          return context.text(unexpectedTaskCreationMessage, 503);
        }

        return new Response(
          (await response.text()) || 'Task request is invalid.',
          {
            status: response.status,
          },
        );
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
        return context.text(unexpectedTaskCreationMessage, 503);
      }

      return context.text('Task creation failed.', 500);
    }
  });
}
