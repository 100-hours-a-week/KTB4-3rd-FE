import type { ReactNode } from 'react';

import type { ChatWebSocketMessage } from '@/entities/chat';
import {
  useChatRoomWebSocket,
  type UseChatRoomWebSocketOptions,
} from './use-chat-room-websocket';

export type ChatRoomWebSocketConnectionValue = ReturnType<typeof useChatRoomWebSocket>;

export type ChatRoomWebSocketConnectionProps = {
  roomId: string;
  enabled?: boolean;
  onMessage?: UseChatRoomWebSocketOptions['onMessage'];
  children: (connection: ChatRoomWebSocketConnectionValue) => ReactNode;
};

export function ChatRoomWebSocketConnection({
  roomId,
  enabled = true,
  onMessage,
  children,
}: ChatRoomWebSocketConnectionProps) {
  const connection = useChatRoomWebSocket({
    enabled,
    onMessage: (message: ChatWebSocketMessage) => onMessage?.(message),
    roomId,
  });

  return children(connection);
}
