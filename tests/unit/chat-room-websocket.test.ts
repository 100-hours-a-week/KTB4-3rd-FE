import { describe, expect, it } from 'vitest';

import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

const websocketUrl = 'ws://localhost:8080/ws';

function createFrame(command: string, headers: Record<string, string>, body = '') {
  const headerText = Object.entries(headers)
    .map(([name, value]) => `${name}:${value}`)
    .join('\n');

  return `${command}\n${headerText}\n\n${body}\0`;
}

function parseFrame(data: unknown): StompFrame {
  if (typeof data !== 'string') {
    throw new Error('STOMP mock frame must be a string');
  }

  const frameText = data.replace(/\0$/, '').replace(/^\n+/, '');
  const separatorIndex = frameText.indexOf('\n\n');
  const headerText = separatorIndex === -1 ? frameText : frameText.slice(0, separatorIndex);
  const body = separatorIndex === -1 ? '' : frameText.slice(separatorIndex + 2);
  const [command, ...headerLines] = headerText.split('\n');
  const headers = Object.fromEntries(
    headerLines.flatMap((line) => {
      const colonIndex = line.indexOf(':');

      return colonIndex === -1 ? [] : [[line.slice(0, colonIndex), line.slice(colonIndex + 1)]];
    }),
  );

  return { command, headers, body };
}

function waitForSocketOpen(socket: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    const handleOpen = () => {
      socket.removeEventListener('error', handleError);
      resolve();
    };
    const handleError = () => {
      socket.removeEventListener('open', handleOpen);
      reject(new Error('WebSocket connection failed'));
    };

    socket.addEventListener('open', handleOpen, { once: true });
    socket.addEventListener('error', handleError, { once: true });
  });
}

function waitForSocketFrame(socket: WebSocket, command: string) {
  return new Promise<StompFrame>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.removeEventListener('message', handleMessage);
      reject(new Error(`Timed out waiting for STOMP ${command} frame`));
    }, 1000);

    const handleMessage = (event: MessageEvent) => {
      const frame = parseFrame(event.data);

      if (frame.command !== command) {
        return;
      }

      clearTimeout(timeoutId);
      socket.removeEventListener('message', handleMessage);
      resolve(frame);
    };

    socket.addEventListener('message', handleMessage);
  });
}

function waitForSocketClose(socket: WebSocket) {
  return new Promise<CloseEvent>((resolve) => {
    socket.addEventListener('close', (event) => resolve(event), { once: true });
  });
}

function waitForTick() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

async function connectSocket(authorization = `Bearer ${MOCK_ACCESS_TOKEN}`) {
  const socket = new WebSocket(websocketUrl);
  await waitForSocketOpen(socket);

  const connectedFrame = waitForSocketFrame(socket, 'CONNECTED');
  socket.send(
    createFrame('CONNECT', {
      authorization,
      'accept-version': '1.2',
      'heart-beat': '10000,10000',
    }),
  );
  await connectedFrame;

  return socket;
}

describe('chat room WebSocket mock', () => {
  it('CONNECT, SUBSCRIBE, SEND 흐름을 처리하고 구독자에게 메시지를 broadcast한다', async () => {
    const firstSocket = await connectSocket();
    const secondSocket = await connectSocket();

    firstSocket.send(createFrame('SUBSCRIBE', { id: 'sub-1', destination: '/sub/chat/501' }));
    secondSocket.send(createFrame('SUBSCRIBE', { id: 'sub-1', destination: '/sub/chat/501' }));
    await waitForTick();

    const firstMessage = waitForSocketFrame(firstSocket, 'MESSAGE');
    const secondMessage = waitForSocketFrame(secondSocket, 'MESSAGE');

    firstSocket.send(
      createFrame(
        'SEND',
        { destination: '/pub/chat/501', 'content-type': 'application/json' },
        JSON.stringify({ content: '3분 뒤 도착합니다', client_message_id: 'client-message-1' }),
      ),
    );

    const [firstFrame, secondFrame] = await Promise.all([firstMessage, secondMessage]);

    expect(firstFrame.headers.subscription).toBe('sub-1');
    expect(secondFrame.headers.subscription).toBe('sub-1');
    expect(JSON.parse(firstFrame.body)).toMatchObject({
      type: 'TEXT',
      content: '3분 뒤 도착합니다',
      sender: { id: 7, nickname: '우림' },
    });
    expect(JSON.parse(secondFrame.body)).toEqual(JSON.parse(firstFrame.body));

    firstSocket.close();
    secondSocket.close();
  });

  it('같은 client_message_id로 다시 SEND하면 중복 메시지를 만들지 않는다', async () => {
    const socket = await connectSocket();
    socket.send(createFrame('SUBSCRIBE', { id: 'sub-duplicate', destination: '/sub/chat/501' }));
    await waitForTick();

    const firstMessage = waitForSocketFrame(socket, 'MESSAGE');
    const frame = createFrame(
      'SEND',
      { destination: '/pub/chat/501', 'content-type': 'application/json' },
      JSON.stringify({
        content: '한 번만 생성돼요',
        client_message_id: 'client-message-duplicate',
      }),
    );
    socket.send(frame);
    const firstMessageFrame = await firstMessage;
    const receivedFrames: StompFrame[] = [];
    const handleMessage = (event: MessageEvent) => {
      const receivedFrame = parseFrame(event.data);

      if (receivedFrame.command === 'MESSAGE') {
        receivedFrames.push(receivedFrame);
      }
    };

    socket.addEventListener('message', handleMessage);
    socket.send(frame);
    await waitForTick();
    socket.removeEventListener('message', handleMessage);

    expect(receivedFrames).toHaveLength(0);
    expect(JSON.parse(firstMessageFrame.body).id).toBeDefined();

    socket.close();
  });

  it('잘못된 CONNECT 인증은 ERROR 프레임을 보내고 연결을 종료한다', async () => {
    const socket = new WebSocket(websocketUrl);
    await waitForSocketOpen(socket);

    const errorFrame = waitForSocketFrame(socket, 'ERROR');
    const closeEvent = waitForSocketClose(socket);
    socket.send(createFrame('CONNECT', { authorization: 'Bearer invalid-token' }));

    const [frame, close] = await Promise.all([errorFrame, closeEvent]);

    expect(frame.headers.message).toBe('로그인이 필요합니다');
    expect(JSON.parse(frame.body)).toMatchObject({
      error: { code: 'UNAUTHORIZED' },
    });
    expect(close.code).toBe(4001);
  });

  it('참여하지 않은 채팅방 구독은 조용히 무시한다', async () => {
    const socket = await connectSocket();
    const receivedFrames: StompFrame[] = [];
    const handleMessage = (event: MessageEvent) => {
      receivedFrames.push(parseFrame(event.data));
    };

    socket.addEventListener('message', handleMessage);
    socket.send(createFrame('SUBSCRIBE', { id: 'sub-invalid', destination: '/sub/chat/999' }));
    socket.send(
      createFrame(
        'SEND',
        { destination: '/pub/chat/999', 'content-type': 'application/json' },
        JSON.stringify({
          content: '전송되지 않아야 해요',
          client_message_id: 'client-message-invalid',
        }),
      ),
    );
    await waitForTick();
    socket.removeEventListener('message', handleMessage);

    expect(receivedFrames).toHaveLength(0);
    socket.close();
  });
});
