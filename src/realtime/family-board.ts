import { DurableObject } from 'cloudflare:workers';
import { z } from 'zod';
import type { WorkerBindings } from '@/config/runtime';
import {
  clientWebSocketMessageSchema,
  initResponseSchema,
  stateUpdateMessageSchema,
} from '@/types';
import {
  FamilyBoardStateError,
  getFamilyBoardState,
  toggleTaskCompletion,
} from '@/services/family-board-service';

const webSocketAttachmentSchema = z
  .object({
    familyId: z.string().min(1),
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

function getAttachedFamilyId(socket: WebSocket): string {
  return webSocketAttachmentSchema.parse(socket.deserializeAttachment()).familyId;
}

function toInitResponse(state: Awaited<ReturnType<typeof getFamilyBoardState>>): string {
  return JSON.stringify(
    initResponseSchema.parse({
      type: 'init_response',
      state,
    }),
  );
}

function toStateUpdate(state: Awaited<ReturnType<typeof getFamilyBoardState>>): string {
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

    server.serializeAttachment({ familyId });
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
      const familyId = getAttachedFamilyId(socket);
      const payload = clientWebSocketMessageSchema.parse(
        JSON.parse(getMessageText(message)),
      );

      switch (payload.type) {
        case 'init': {
          const state = await getFamilyBoardState(this.env.DB, familyId, payload.date);

          socket.send(toInitResponse(state));
          return;
        }
        case 'task_toggled': {
          await toggleTaskCompletion(this.env.DB, {
            familyId,
            taskId: payload.task_id,
            date: payload.date,
            completed: payload.completed,
          });

          const state = await getFamilyBoardState(this.env.DB, familyId, payload.date);
          const update = toStateUpdate(state);

          for (const connection of this.ctx.getWebSockets()) {
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
