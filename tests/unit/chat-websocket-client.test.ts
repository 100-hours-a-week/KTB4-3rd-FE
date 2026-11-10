import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatWebSocketClient,
  getChatWebSocketUrl,
  type ChatWebSocketMessage,
} from '@/entities/chat';
import {
  emitMockSettlementAnalysisFinished,
  emitMockTaxiPotMatched,
} from '@/shared/api/mocks/chat-room-websocket.handlers';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';

const clients: ChatWebSocketClient[] = [];

afterEach(() => {
  clients.splice(0).forEach((client) => client.disconnect());
  vi.unstubAllEnvs();
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
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8080');
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_URL', '');

    expect(getChatWebSocketUrl()).toBe('ws://localhost:8080/wss');
  });

  it('미터기와 송금 분석 완료 이벤트를 정산 콜백으로 전달한다', async () => {
    const finishedMessages: unknown[] = [];
    const client = new ChatWebSocketClient({
      accessToken: MOCK_ACCESS_TOKEN,
      onSettlementAnalysisFinished: (message) => finishedMessages.push(message),
      roomId: '501',
    });
    clients.push(client);

    await client.connect();
    await new Promise((resolve) => setTimeout(resolve, 20));
    emitMockSettlementAnalysisFinished({
      type: 'METER_ANALYSIS_FINISHED',
      settlement_id: 123,
      meter_analysis_status: 'PASSED',
      remaining_meter_attempts: 1,
    });
    emitMockSettlementAnalysisFinished({
      type: 'TRANSFER_ANALYZED',
      settlement_id: 123,
      user_id: 43,
      name: '홍길동',
      member_analysis_status: 'PASSED',
      transfer_completed: true,
      remaining_transfer_attempts: 1,
    });

    await waitForFinishedMessages(finishedMessages, 2);

    expect(finishedMessages).toEqual([
      {
        type: 'METER_ANALYSIS_FINISHED',
        settlement_id: 123,
        meter_analysis_status: 'PASSED',
        remaining_meter_attempts: 1,
      },
      {
        type: 'TRANSFER_ANALYZED',
        settlement_id: 123,
        user_id: 43,
        name: '홍길동',
        member_analysis_status: 'PASSED',
        transfer_completed: true,
        remaining_transfer_attempts: 1,
      },
    ]);
  });

  it('택시팟 매칭 완료 이벤트를 매칭 콜백으로 전달한다', async () => {
    const matchedMessages: unknown[] = [];
    const client = new ChatWebSocketClient({
      accessToken: MOCK_ACCESS_TOKEN,
      onTaxiPotMatched: (message) => matchedMessages.push(message),
      subscribeTaxiPotMatching: true,
    });
    clients.push(client);

    await client.connect();
    await new Promise((resolve) => setTimeout(resolve, 20));
    emitMockTaxiPotMatched({ type: 'MATCHED', taxi_pot_id: 7, chat_room_id: 9 });

    await waitForFinishedMessages(matchedMessages, 1);

    expect(matchedMessages).toEqual([{ type: 'MATCHED', taxi_pot_id: 7, chat_room_id: 9 }]);
  });

  it('API base path를 포함한 웹소켓 주소를 파생한다', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://dev.moyeota.com/api');
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_URL', '');

    expect(getChatWebSocketUrl()).toBe('wss://dev.moyeota.com/api/wss');
  });
});

async function waitForFinishedMessages(messages: readonly unknown[], count: number) {
  const deadline = Date.now() + 1_000;

  while (messages.length < count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
