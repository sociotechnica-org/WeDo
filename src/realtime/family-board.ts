import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';
import { getRuntimeConfig } from '@/config/runtime';
import type { WorkerBindings } from '@/config/runtime';
import {
  clientWebSocketMessageSchema,
  initResponseSchema,
  isoDateSchema,
  stateUpdateMessageSchema,
} from '@/types';
import {
  FamilyBoardStateError,
  getFamilyBoardState,
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

export class FamilyBoard extends DurableObject<WorkerBindings> {
  override async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('Expected websocket upgrade.', { status: 426 });
    }

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

          const state = await getFamilyBoardState(
            this.env.DB,
            familyId,
            resolvedDate,
          );
          const update = toStateUpdate(state);

          for (const connection of this.ctx.getWebSockets()) {
            const attachment = getSocketAttachment(connection);

            if (attachment.familyId !== familyId) {
              continue;
            }

            if (attachment.date !== resolvedDate) {
              continue;
            }

            connection.send(update);
          }
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
