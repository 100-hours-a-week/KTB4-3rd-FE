import { afterEach, describe, expect, it } from 'vitest';

import {
  ChatWebSocketClient,
  getChatWebSocketUrl,
  type ChatWebSocketMessage,
} from '@/entities/chat';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';

const clients: ChatWebSocketClient[] = [];

afterEach(() => {
  clients.splice(0).forEach((client) => client.disconnect());
});

describe('ChatWebSocketClient', () => {
  it('채팅방에 연결하고 구독한 메시지를 수신한다', async () => {
    const messages: ChatWebSocketMessage[] = [];
    const client = new ChatWebSocketClient({
      accessToken: MOCK_ACCESS_TOKEN,
      onMessage: (message) => messages.push(message),
      roomId: '501',
    });
    clients.push(client);

    await client.connect();

    expect(client.sendMessage('새로운 메시지')).toBe(true);

    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('메시지 수신 시간이 초과됐어요.')), 1000);
      const checkMessage = () => {
        if (messages.some((message) => message.content === '새로운 메시지')) {
          clearTimeout(timeoutId);
          resolve();
          return;
        }

        setTimeout(checkMessage, 10);
      };

      checkMessage();
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      content: '새로운 메시지',
      type: 'TEXT',
    });
  });

  it('기본 API 주소에서 웹소켓 주소를 파생한다', () => {
    expect(getChatWebSocketUrl()).toBe('ws://localhost:8080/ws');
  });
});
