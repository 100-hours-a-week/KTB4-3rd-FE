'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getAccessToken } from '@/entities/auth';
import {
  ChatWebSocketClient,
  type ChatWebSocketMessage,
  type ChatWebSocketStatus,
} from '@/entities/chat';

export type UseChatRoomWebSocketOptions = {
  roomId: string;
  enabled?: boolean;
  onMessage?: (message: ChatWebSocketMessage) => void;
};

export function useChatRoomWebSocket({
  roomId,
  enabled = true,
  onMessage,
}: UseChatRoomWebSocketOptions) {
  const [status, setStatus] = useState<ChatWebSocketStatus>(enabled ? 'connecting' : 'closed');
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<ChatWebSocketClient | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;
    let client: ChatWebSocketClient | null = null;

    getAccessToken()
      .then((accessToken) => {
        if (disposed) {
          return;
        }

        client = new ChatWebSocketClient({
          accessToken,
          onError: (nextError) => {
            if (!disposed) {
              setError(nextError);
            }
          },
          onMessage: (message) => onMessageRef.current?.(message),
          onStatusChange: (nextStatus) => {
            if (!disposed) {
              setStatus(nextStatus);
            }
          },
          roomId,
        });
        clientRef.current = client;

        return client.connect();
      })
      .catch((nextError: unknown) => {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError : new Error('채팅방 연결에 실패했어요.'));
          setStatus('error');
        }
      });

    return () => {
      disposed = true;
      client?.disconnect();
      clientRef.current = null;
    };
  }, [enabled, roomId]);

  const sendMessage = useCallback(
    (content: string) => clientRef.current?.sendMessage(content) ?? false,
    [],
  );

  return {
    error,
    sendMessage,
    status: enabled ? status : 'closed',
  };
}
