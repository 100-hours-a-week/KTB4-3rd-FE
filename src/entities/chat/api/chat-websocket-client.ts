export type ChatWebSocketMessage = {
  id: number;
  type: 'TEXT' | 'SYSTEM_JOIN' | 'SYSTEM_RIDE_START_REQUESTED';
  content: string | null;
  sender?: {
    id: number;
    nickname: string;
    profile_image_url: string | null;
  };
  joiner?: {
    id: number;
    name: string;
  };
  created_at: string;
};

export type ChatWebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

export type ChatWebSocketClientOptions = {
  roomId: string;
  accessToken: string;
  url?: string;
  onMessage?: (message: ChatWebSocketMessage) => void;
  onStatusChange?: (status: ChatWebSocketStatus) => void;
  onError?: (error: Error) => void;
};

type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

function encodeHeaderValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll(':', '\\c').replaceAll('\n', '\\n');
}

function decodeHeaderValue(value: string) {
  return value.replaceAll('\\n', '\n').replaceAll('\\c', ':').replaceAll('\\\\', '\\');
}

function createFrame(command: string, headers: Record<string, string>, body = '') {
  const headerText = Object.entries(headers)
    .map(([name, value]) => `${encodeHeaderValue(name)}:${encodeHeaderValue(value)}`)
    .join('\n');

  return `${command}\n${headerText}\n\n${body}\0`;
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

        return [
          [
            decodeHeaderValue(line.slice(0, colonIndex)),
            decodeHeaderValue(line.slice(colonIndex + 1)),
          ],
        ];
      }),
    );

    return [{ command, headers, body }];
  });
}

function createMessageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `chat-message-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDefaultWebSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

  if (/^https?:\/\//.test(apiBaseUrl)) {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    url.hash = '';

    return url.toString().replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://localhost:8080/ws';
}

async function readWebSocketData(data: unknown) {
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

export function getChatWebSocketUrl() {
  return getDefaultWebSocketUrl();
}

export class ChatWebSocketClient {
  private readonly options: ChatWebSocketClientOptions;

  private socket: WebSocket | null = null;

  private connectPromise: Promise<void> | null = null;

  private resolveConnect: (() => void) | null = null;

  private rejectConnect: ((error: Error) => void) | null = null;

  private isStompConnected = false;

  private readonly subscriptionId = `chat-subscription-${createMessageId()}`;

  constructor(options: ChatWebSocketClientOptions) {
    this.options = options;
  }

  connect() {
    if (this.isStompConnected) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.notifyStatus('connecting');
    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnect = resolve;
      this.rejectConnect = reject;
      this.socket = new WebSocket(this.options.url ?? getDefaultWebSocketUrl());

      this.socket.addEventListener('open', this.handleOpen);
      this.socket.addEventListener('message', this.handleMessage);
      this.socket.addEventListener('error', this.handleError);
      this.socket.addEventListener('close', this.handleClose);
    });

    return this.connectPromise;
  }

  sendMessage(content: string) {
    if (!this.isStompConnected || this.socket?.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.socket.send(
      createFrame(
        'SEND',
        {
          destination: `/pub/chat/${this.options.roomId}`,
          'content-type': 'application/json',
        },
        JSON.stringify({ content, client_message_id: createMessageId() }),
      ),
    );

    return true;
  }

  disconnect() {
    this.isStompConnected = false;

    if (!this.socket) {
      this.notifyStatus('closed');
      return;
    }

    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(createFrame('DISCONNECT', { receipt: createMessageId() }));
      this.socket.close(1000, 'DISCONNECT');
      return;
    }

    if (this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close(1000, 'DISCONNECT');
    }
  }

  private readonly handleOpen = () => {
    this.socket?.send(
      createFrame('CONNECT', {
        Authorization: `Bearer ${this.options.accessToken}`,
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
      }),
    );
  };

  private readonly handleMessage = (event: MessageEvent) => {
    void this.handleMessageData(event.data);
  };

  private readonly handleError = () => {
    this.fail(new Error('채팅방 연결에 실패했어요.'));
  };

  private readonly handleClose = () => {
    this.socket = null;

    if (!this.isStompConnected) {
      this.rejectConnect?.(new Error('채팅방 연결이 종료되었어요.'));
    }

    this.isStompConnected = false;
    this.clearPendingConnect();
    this.notifyStatus('closed');
  };

  private async handleMessageData(data: unknown) {
    const text = await readWebSocketData(data);

    if (text === null) {
      return;
    }

    for (const frame of parseFrames(text)) {
      if (frame.command === 'CONNECTED') {
        this.isStompConnected = true;
        this.socket?.send(
          createFrame('SUBSCRIBE', {
            id: this.subscriptionId,
            destination: `/sub/chat/${this.options.roomId}`,
          }),
        );
        this.notifyStatus('open');
        this.resolveConnect?.();
        this.clearPendingConnect();
        continue;
      }

      if (frame.command === 'MESSAGE') {
        try {
          this.options.onMessage?.(JSON.parse(frame.body) as ChatWebSocketMessage);
        } catch {
          this.options.onError?.(new Error('채팅 메시지를 읽지 못했어요.'));
        }
        continue;
      }

      if (frame.command === 'ERROR') {
        this.fail(new Error(frame.headers.message ?? '채팅방 연결에 실패했어요.'));
      }
    }
  }

  private fail(error: Error) {
    this.options.onError?.(error);
    this.notifyStatus('error');
    this.rejectConnect?.(error);
    this.clearPendingConnect();
  }

  private clearPendingConnect() {
    this.connectPromise = null;
    this.resolveConnect = null;
    this.rejectConnect = null;
  }

  private notifyStatus(status: ChatWebSocketStatus) {
    this.options.onStatusChange?.(status);
  }
}
