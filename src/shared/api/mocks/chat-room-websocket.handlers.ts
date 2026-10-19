import { ws, type WebSocketData, type WebSocketHandlerConnection } from 'msw';

import { MOCK_ACCESS_TOKEN } from './mock-utils';

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

type MockChatMessageBase = {
  id: number;
  sender?: {
    id: number;
    nickname?: string;
    name?: string;
    profile_image_url: string | null;
  };
  joiner?: { id: number; name: string };
  leaver?: { id: number; name: string };
  content?: string | null;
  created_at: string;
};

type MockChatMessage =
  | (MockChatMessageBase & {
      type:
        | 'TEXT'
        | 'SYSTEM_JOIN'
        | 'SYSTEM_LEAVE'
        | 'SYSTEM_RIDE_START_REQUESTED'
        | 'SYSTEM_RIDE_STARTED'
        | 'SYSTEM_RIDE_END_REQUESTED'
        | 'SYSTEM_RIDE_ENDED';
      settlement?: never;
    })
  | (MockChatMessageBase & {
      type:
        | 'SYSTEM_METER_REQUESTED'
        | 'SYSTEM_SETTLEMENT_COMPLETED'
        | 'SYSTEM_TRANSFER_DONE'
        | 'SYSTEM_SETTLEMENT_CONFIRM_REQUESTED';
      content: string;
      sender?: never;
      settlement?: never;
    })
  | (MockChatMessageBase & {
      type: 'SYSTEM_TRANSFER_REQUESTED';
      content: string;
      settlement: {
        settlement_id: number;
        total_amount: number;
        amount_per_person: number;
        payee: {
          id: number;
          name: string;
          bank_name: string;
          account_no: string;
        };
      };
      sender?: never;
    });

type ChatRoomSubscription = {
  client: WebSocketHandlerConnection['client'];
  subscriptionId: string;
  roomId: string;
};

const MOCK_CHAT_ROOM_IDS = new Set(['101', '501', '599', '600', '601']);
const MOCK_TAXI_POT_ROOM_IDS = new Set(['599', '600', '601']);
const MOCK_CHAT_UI_PREVIEW_ROOM_ID = '601';
const MOCK_CHAT_UI_PREVIEW_MESSAGES: readonly MockChatMessage[] = [
  {
    id: 1456,
    type: 'TEXT',
    sender: { id: 7, name: 'rachel', profile_image_url: null },
    content: '3분 뒤 도착합니다',
    created_at: '2026-09-05T07:59:03.000Z',
  },
  {
    id: 1457,
    type: 'SYSTEM_JOIN',
    joiner: { id: 9, name: '루디' },
    created_at: '2026-09-05T07:40:00.000Z',
  },
  {
    id: 1458,
    type: 'SYSTEM_LEAVE',
    leaver: { id: 12, name: '민준' },
    created_at: '2026-09-05T07:35:00.000Z',
  },
  {
    id: 1459,
    type: 'SYSTEM_RIDE_START_REQUESTED',
    created_at: '2026-09-05T07:58:12.000Z',
  },
  {
    id: 1460,
    type: 'SYSTEM_RIDE_STARTED',
    created_at: '2026-09-05T07:58:40.000Z',
  },
  {
    id: 1461,
    type: 'SYSTEM_RIDE_END_REQUESTED',
    created_at: '2026-09-05T08:22:00.000Z',
  },
  {
    id: 1462,
    type: 'SYSTEM_RIDE_ENDED',
    created_at: '2026-09-05T08:23:00.000Z',
  },
  {
    id: 1463,
    type: 'SYSTEM_TRANSFER_DONE',
    content: '애롱롱님이 송금을 완료했어요! 금액 13,000원',
    created_at: '2026-09-05T08:24:00.000Z',
  },
  {
    id: 1464,
    type: 'SYSTEM_SETTLEMENT_CONFIRM_REQUESTED',
    content: '모두의 송금이 잘 전달됐나요?',
    created_at: '2026-09-05T08:25:00.000Z',
  },
  {
    id: 1465,
    type: 'SYSTEM_SETTLEMENT_COMPLETED',
    content: '정산이 완료됐어요',
    created_at: '2026-09-05T08:26:00.000Z',
  },
];
const subscriptions = new Map<string, ChatRoomSubscription>();
const settlementSubscriptions = new Map<
  string,
  { client: WebSocketHandlerConnection['client']; subscriptionId: string }
>();
const processedMessages = new Map<string, MockChatMessage>();
const pendingMessages = new Map<string, MockChatMessage[]>();
const previewTimers = new Map<string, ReturnType<typeof setTimeout>[]>();
let nextMessageId = 1466;

function getHeader(headers: Record<string, string>, name: string) {
  const headerName = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === headerName);

  return entry?.[1];
}

async function getText(data: WebSocketData): Promise<string | null> {
  if (typeof data === 'string') {
    return data;
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return data.text();
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }

  return null;
}

function parseFrames(text: string): StompFrame[] {
  return text.split('\0').flatMap((rawFrame) => {
    const frameText = rawFrame.replace(/^\n+/, '');

    if (!frameText) {
      return [];
    }

    const separatorIndex = frameText.indexOf('\n\n');
    const headerText = separatorIndex === -1 ? frameText : frameText.slice(0, separatorIndex);
    const body = separatorIndex === -1 ? '' : frameText.slice(separatorIndex + 2);
    const [command, ...headerLines] = headerText.split('\n');
    const headers = Object.fromEntries(
      headerLines.flatMap((line) => {
        const colonIndex = line.indexOf(':');

        if (colonIndex === -1) {
          return [];
        }

        return [[line.slice(0, colonIndex), line.slice(colonIndex + 1)]];
      }),
    );

    return [{ command, headers, body }];
  });
}

function createFrame(command: string, headers: Record<string, string>, body = '') {
  const headerText = Object.entries(headers)
    .map(([name, value]) => `${name}:${value}`)
    .join('\n');

  return `${command}\n${headerText}\n\n${body}\0`;
}

function sendError(client: WebSocketHandlerConnection['client'], message: string, code: string) {
  client.send(
    createFrame(
      'ERROR',
      { message, 'content-type': 'application/json' },
      JSON.stringify({
        message,
        error: { code, field: null },
      }),
    ),
  );
}

function isValidRoom(roomId: string | undefined): roomId is string {
  return roomId !== undefined && MOCK_CHAT_ROOM_IDS.has(roomId);
}

function getRoomId(destination: string | undefined, prefix: string) {
  if (!destination?.startsWith(prefix)) {
    return undefined;
  }

  const roomId = destination.slice(prefix.length);

  return /^\d+$/.test(roomId) ? roomId : undefined;
}

function removeClientSubscriptions(client: WebSocketHandlerConnection['client']) {
  for (const [subscriptionId, subscription] of subscriptions) {
    if (subscription.client.id === client.id) {
      subscriptions.delete(subscriptionId);
      previewTimers.get(subscriptionId)?.forEach((timer) => clearTimeout(timer));
      previewTimers.delete(subscriptionId);
    }
  }
  for (const [subscriptionKey, subscription] of settlementSubscriptions) {
    if (subscription.client.id === client.id) {
      settlementSubscriptions.delete(subscriptionKey);
    }
  }
}

function sendMessageToSubscription(subscription: ChatRoomSubscription, message: MockChatMessage) {
  subscription.client.send(
    createFrame(
      'MESSAGE',
      {
        destination: `/sub/chat/${subscription.roomId}`,
        subscription: subscription.subscriptionId,
        'message-id': String(message.id),
        'content-type': 'application/json',
      },
      JSON.stringify(message),
    ),
  );
}

export function emitMockChatRoomMessage(roomId: string, message: MockChatMessage) {
  let delivered = false;

  for (const subscription of subscriptions.values()) {
    if (subscription.roomId !== roomId) {
      continue;
    }

    delivered = true;

    sendMessageToSubscription(subscription, message);
  }

  if (!delivered) {
    pendingMessages.set(roomId, [...(pendingMessages.get(roomId) ?? []), message]);
  }
}

type MockSettlementAnalysisFinishedMessage =
  | {
      type: 'METER_ANALYSIS_FINISHED';
      settlement_id: number;
      meter_analysis_status: 'PASSED' | 'FAILED';
      remaining_meter_attempts: number;
    }
  | {
      type: 'TRANSFER_ANALYZED';
      settlement_id: number;
      user_id: number;
      name: string;
      member_analysis_status: 'PASSED' | 'FAILED';
      transfer_completed: boolean;
      remaining_transfer_attempts: number;
    };

export function emitMockSettlementAnalysisFinished(message: MockSettlementAnalysisFinishedMessage) {
  for (const [key, subscription] of settlementSubscriptions) {
    subscription.client.send(
      createFrame(
        'MESSAGE',
        {
          destination: '/user/sub/settlement',
          subscription: subscription.subscriptionId,
          'message-id': key,
          'content-type': 'application/json',
        },
        JSON.stringify(message),
      ),
    );
  }
}

function scheduleChatUiPreview(subscription: ChatRoomSubscription) {
  if (subscription.roomId !== MOCK_CHAT_UI_PREVIEW_ROOM_ID) {
    return;
  }

  const subscriptionKey = `${subscription.client.id}:${subscription.subscriptionId}`;
  const timers = MOCK_CHAT_UI_PREVIEW_MESSAGES.map((message, index) =>
    setTimeout(
      () => {
        const activeSubscription = subscriptions.get(subscriptionKey);

        if (activeSubscription) {
          sendMessageToSubscription(activeSubscription, message);
        }
      },
      (index + 1) * 2500,
    ),
  );

  previewTimers.set(subscriptionKey, timers);
}

function handleConnect(client: WebSocketHandlerConnection['client'], frame: StompFrame) {
  const authorization = getHeader(frame.headers, 'authorization');

  if (authorization !== `Bearer ${MOCK_ACCESS_TOKEN}`) {
    sendError(client, '로그인이 필요합니다', 'UNAUTHORIZED');
    queueMicrotask(() => client.close(4001, 'UNAUTHORIZED'));
    return false;
  }

  client.send(
    createFrame('CONNECTED', {
      version: '1.2',
      'heart-beat': '0,0',
    }),
  );

  return true;
}

function handleSubscribe(client: WebSocketHandlerConnection['client'], frame: StompFrame) {
  const subscriptionId = getHeader(frame.headers, 'id');
  const destination = getHeader(frame.headers, 'destination');
  if (!subscriptionId) {
    return;
  }
  if (destination === '/user/sub/settlement') {
    settlementSubscriptions.set(`${client.id}:${subscriptionId}`, { client, subscriptionId });
    return;
  }
  if (destination === '/user/sub/errors') {
    return;
  }
  const roomId = getRoomId(destination, '/sub/chat/');

  if (!subscriptionId || !isValidRoom(roomId)) {
    return;
  }

  const subscription = { client, roomId, subscriptionId };
  const subscriptionKey = `${client.id}:${subscriptionId}`;

  subscriptions.set(subscriptionKey, subscription);

  const pendingRoomMessages = pendingMessages.get(roomId);

  if (pendingRoomMessages) {
    pendingMessages.delete(roomId);

    for (const message of pendingRoomMessages) {
      sendMessageToSubscription(subscription, message);
    }
  }

  scheduleChatUiPreview(subscription);
}

function handleUnsubscribe(client: WebSocketHandlerConnection['client'], frame: StompFrame) {
  const subscriptionId = getHeader(frame.headers, 'id');

  if (subscriptionId) {
    subscriptions.delete(`${client.id}:${subscriptionId}`);
    settlementSubscriptions.delete(`${client.id}:${subscriptionId}`);
  }
}

function handleSend(frame: StompFrame) {
  const roomId = getRoomId(getHeader(frame.headers, 'destination'), '/pub/chat/');

  if (!isValidRoom(roomId)) {
    return;
  }

  let payload: { content?: unknown; client_message_id?: unknown };

  try {
    payload = JSON.parse(frame.body) as { content?: unknown; client_message_id?: unknown };
  } catch {
    return;
  }

  const content = payload.content;
  const clientMessageId = payload.client_message_id;

  if (typeof content !== 'string' || typeof clientMessageId !== 'string') {
    return;
  }

  const messageKey = `${roomId}:${clientMessageId}`;
  if (processedMessages.has(messageKey)) {
    return;
  }

  const message: MockChatMessage = {
    id: nextMessageId++,
    type: 'TEXT',
    sender: MOCK_TAXI_POT_ROOM_IDS.has(roomId)
      ? { id: 7, name: '우림', profile_image_url: null }
      : { id: 7, nickname: '우림', profile_image_url: null },
    content,
    created_at: new Date().toISOString(),
  };

  processedMessages.set(messageKey, message);
  emitMockChatRoomMessage(roomId, message);
}

const chatRoomWebSocket = ws.link('*/wss');

const chatRoomWebSocketHandler = chatRoomWebSocket.addEventListener('connection', ({ client }) => {
  let isConnected = false;

  client.addEventListener('message', async ({ data }) => {
    const text = await getText(data);

    if (text === null) {
      return;
    }

    for (const frame of parseFrames(text)) {
      if (!isConnected) {
        if (frame.command !== 'CONNECT' && frame.command !== 'STOMP') {
          continue;
        }

        isConnected = handleConnect(client, frame);
        continue;
      }

      if (frame.command === 'SUBSCRIBE') {
        handleSubscribe(client, frame);
      }

      if (frame.command === 'UNSUBSCRIBE') {
        handleUnsubscribe(client, frame);
      }

      if (frame.command === 'SEND') {
        handleSend(frame);
      }

      if (frame.command === 'DISCONNECT') {
        client.close(1000, 'DISCONNECT');
      }
    }
  });

  client.addEventListener('close', () => {
    removeClientSubscriptions(client);
  });
});

export const chatRoomWebSocketHandlers = [chatRoomWebSocketHandler];
