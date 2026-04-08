import { DurableObject } from 'cloudflare:workers';
import { ZodError, z } from 'zod';
import { getRuntimeConfig } from '@/config/runtime';
import type { WorkerBindings } from '@/config/runtime';
import {
  clientWebSocketMessageSchema,
  compareIsoDates,
  createTaskMutationSchema,
  createTaskResponseSchema,
  initResponseSchema,
  isoDateSchema,
  stateUpdateMessageSchema,
  type IsoDate,
} from '@/types';
import {
  createRecurringTask,
  deleteTask,
  FamilyBoardStateError,
  getFamilyBoardState,
  toggleSkipDay,
  toggleTaskCompletion,
} from '@/services/family-board-service';
import { resolveBoardDate } from '@/services/board-service';

const webSocketAttachmentSchema = z
  .object({
    familyId: z.string().min(1),
    date: isoDateSchema.optional(),
  })
  .strict();

function getMessageText(message: ArrayBuffer | string): string {
  if (typeof message === 'string') {
    return message;
  }

  return new TextDecoder().decode(message);
}

function getFamilyIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  const familyId = url.pathname.split('/').at(-1);

  if (!familyId) {
    throw new FamilyBoardStateError('Realtime request is missing a family id.');
  }

  return familyId;
}

function getSocketAttachment(socket: WebSocket) {
  return webSocketAttachmentSchema.parse(socket.deserializeAttachment());
}

function tryGetSocketAttachment(socket: WebSocket) {
  const result = webSocketAttachmentSchema.safeParse(
    socket.deserializeAttachment(),
  );

  return result.success ? result.data : null;
}

function attachSocketState(socket: WebSocket, familyId: string, date?: string) {
  socket.serializeAttachment({
    familyId,
    date,
  });
}

function toInitResponse(
  state: Awaited<ReturnType<typeof getFamilyBoardState>>,
): string {
  return JSON.stringify(
    initResponseSchema.parse({
      type: 'init_response',
      state,
    }),
  );
}

function toStateUpdate(
  state: Awaited<ReturnType<typeof getFamilyBoardState>>,
): string {
  return JSON.stringify(
    stateUpdateMessageSchema.parse({
      type: 'state_update',
      state,
    }),
  );
}

function getRequestPath(request: Request): string {
  return new URL(request.url).pathname;
}

export class FamilyBoard extends DurableObject<WorkerBindings> {
  private sendMessage(connection: WebSocket, message: string): void {
    try {
      connection.send(message);
    } catch {
      // Closed or invalid sockets should not break other family updates.
    }
  }

  private async getStateUpdateMessage(familyId: string, date: IsoDate) {
    return toStateUpdate(
      await getFamilyBoardState(this.env.DB, familyId, date),
    );
  }

  private getViewedDatesForFamily(familyId: string): IsoDate[] {
    const dates = new Set<IsoDate>();

    for (const connection of this.ctx.getWebSockets()) {
      const attachment = tryGetSocketAttachment(connection);

      if (!attachment || attachment.familyId !== familyId || !attachment.date) {
        continue;
      }

      dates.add(attachment.date);
    }

    return [...dates];
  }

  private async broadcastStateForViewedDates(
    familyId: string,
    seededUpdatesByDate: ReadonlyMap<IsoDate, string> = new Map(),
    minimumDate?: IsoDate,
  ): Promise<void> {
    const viewedDates = this.getViewedDatesForFamily(familyId).filter(
      (date) =>
        minimumDate === undefined || compareIsoDates(date, minimumDate) >= 0,
    );

    if (viewedDates.length === 0) {
      return;
    }

    const updatesByDate = new Map(seededUpdatesByDate);

    for (const date of viewedDates) {
      if (updatesByDate.has(date)) {
        continue;
      }

      try {
        updatesByDate.set(
          date,
          await this.getStateUpdateMessage(familyId, date),
        );
      } catch {
        // A secondary broadcast failure must not turn a successful D1 write
        // into a failed mutation response.
      }
    }

    for (const connection of this.ctx.getWebSockets()) {
      const attachment = tryGetSocketAttachment(connection);

      if (!attachment || attachment.familyId !== familyId || !attachment.date) {
        continue;
      }

      const update = updatesByDate.get(attachment.date);

      if (!update) {
        continue;
      }

      this.sendMessage(connection, update);
    }
  }

  private async handleTaskCreationRequest(
    request: Request,
    familyId: string,
  ): Promise<Response> {
    try {
      const payload = createTaskMutationSchema.parse(
        (await request.json()) as unknown,
      );
      const task = await createRecurringTask(this.env.DB, {
        familyId,
        personId: payload.person_id,
        title: payload.task.title,
        emoji: payload.task.emoji,
        scheduleRules: payload.task.schedule_rules,
      });
      const state = await getFamilyBoardState(
        this.env.DB,
        familyId,
        payload.viewed_date,
      );

      await this.broadcastStateForViewedDates(
        familyId,
        new Map([[payload.viewed_date, toStateUpdate(state)]]),
      );

      return Response.json(
        createTaskResponseSchema.parse({
          task,
          state,
        }),
        {
          status: 201,
        },
      );
    } catch (error) {
      const status =
        error instanceof FamilyBoardStateError || error instanceof ZodError
          ? 400
          : 500;
      const message =
        error instanceof Error ? error.message : 'Task creation failed.';

      return new Response(message, { status });
    }
  }

  override async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader?.toLowerCase() === 'websocket') {
      const familyId = getFamilyIdFromRequest(request);
      const sockets = new WebSocketPair();
      const client = sockets[0];
      const server = sockets[1];

      if (!client || !server) {
        throw new FamilyBoardStateError('Unable to create websocket pair.');
      }

      attachSocketState(server, familyId);
      this.ctx.acceptWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (
      request.method === 'POST' &&
      getRequestPath(request).startsWith('/tasks/')
    ) {
      return await this.handleTaskCreationRequest(
        request,
        getFamilyIdFromRequest(request),
      );
    }

    return new Response('Not found.', { status: 404 });
  }

  override async webSocketMessage(
    socket: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    try {
      const { familyId } = getSocketAttachment(socket);
      const payload = clientWebSocketMessageSchema.parse(
        JSON.parse(getMessageText(message)),
      );

      switch (payload.type) {
        case 'init': {
          const runtime = getRuntimeConfig(this.env);
          const resolvedDate = resolveBoardDate(runtime.timezone, payload.date);
          const state = await getFamilyBoardState(
            this.env.DB,
            familyId,
            resolvedDate,
          );

          attachSocketState(socket, familyId, resolvedDate);
          socket.send(toInitResponse(state));
          return;
        }
        case 'task_toggled': {
          const runtime = getRuntimeConfig(this.env);
          const resolvedDate = resolveBoardDate(runtime.timezone, payload.date);

          if (resolvedDate !== payload.date) {
            throw new FamilyBoardStateError(
              'Realtime requests cannot target a day beyond tomorrow.',
            );
          }

          await toggleTaskCompletion(this.env.DB, {
            familyId,
            taskId: payload.task_id,
            date: resolvedDate,
            completed: payload.completed,
          });

          await this.broadcastStateForViewedDates(
            familyId,
            new Map(),
            resolvedDate,
          );
          return;
        }
        case 'task_deleted': {
          await deleteTask(this.env.DB, {
            familyId,
            taskId: payload.task_id,
          });

          await this.broadcastStateForViewedDates(familyId);
          return;
        }
        case 'skip_day_toggled': {
          const runtime = getRuntimeConfig(this.env);
          const resolvedDate = resolveBoardDate(runtime.timezone, payload.date);

          if (resolvedDate !== payload.date) {
            throw new FamilyBoardStateError(
              'Realtime requests cannot target a day beyond tomorrow.',
            );
          }

          await toggleSkipDay(this.env.DB, {
            familyId,
            date: resolvedDate,
            skipped: payload.skipped,
          });

          await this.broadcastStateForViewedDates(
            familyId,
            new Map(),
            resolvedDate,
          );
          return;
        }
      }
    } catch (error) {
      const messageText =
        error instanceof FamilyBoardStateError
          ? error.message
          : 'Unexpected realtime error.';

      socket.close(1008, messageText);
    }
  }

  override webSocketError(socket: WebSocket): void {
    socket.close(1011, 'Realtime socket error.');
  }
}
