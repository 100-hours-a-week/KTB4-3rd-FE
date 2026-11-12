'use client';

import { useCallback, useMemo, useState } from 'react';

import type { ChatWebSocketMessage } from '@/entities/chat';

import { createChatRoomMessageFromApi, type ChatRoomMessage } from './chat-room';

type LiveMessagesState = {
  roomId: string;
  messages: ChatRoomMessage[];
};

type NewMessagesState = {
  roomId: string;
  cursor: string | null;
  hasNewMessages: boolean;
};

type LiveMemberCountState = {
  roomId: string;
  baseCount: number | null;
  count: number | null;
  processedMessageIds: Set<number>;
};

type UseChatRoomLiveMessagesModelOptions = {
  afterCursor: string | null | undefined;
  baseMemberCount: number | undefined;
  currentUserId?: number;
  fetchNewerMessages: () => Promise<unknown>;
  onRideActionMessage: (message: ChatWebSocketMessage) => boolean;
  onRideEnded?: () => void;
  roomId: string;
};

export function useChatRoomLiveMessagesModel({
  afterCursor,
  baseMemberCount,
  currentUserId,
  fetchNewerMessages,
  onRideActionMessage,
  onRideEnded,
  roomId,
}: UseChatRoomLiveMessagesModelOptions) {
  const [liveMessagesState, setLiveMessagesState] = useState<LiveMessagesState>({
    roomId,
    messages: [],
  });
  const [newMessagesState, setNewMessagesState] = useState<NewMessagesState>({
    roomId,
    cursor: null,
    hasNewMessages: false,
  });
  const [liveMemberCountState, setLiveMemberCountState] = useState<LiveMemberCountState>({
    roomId,
    baseCount: null,
    count: null,
    processedMessageIds: new Set(),
  });

  const hasDeferredAfterCursor =
    afterCursor !== undefined &&
    afterCursor !== null &&
    !(
      newMessagesState.roomId === roomId &&
      newMessagesState.cursor === afterCursor &&
      !newMessagesState.hasNewMessages
    );
  const hasNewMessages =
    (newMessagesState.roomId === roomId && newMessagesState.hasNewMessages) ||
    hasDeferredAfterCursor;

  const appendLiveMessage = useCallback(
    (nextMessage: ChatRoomMessage) => {
      setLiveMessagesState((currentState) => {
        const currentMessages = currentState.roomId === roomId ? currentState.messages : [];

        if (currentMessages.some((currentMessage) => currentMessage.id === nextMessage.id)) {
          return currentState.roomId === roomId
            ? currentState
            : { roomId, messages: currentMessages };
        }

        return { roomId, messages: [...currentMessages, nextMessage] };
      });
    },
    [roomId],
  );

  const syncLiveMemberCount = useCallback(
    (message: ChatWebSocketMessage) => {
      let delta = 0;

      if (message.type === 'SYSTEM_JOIN') {
        delta = 1;
      } else if (message.type === 'SYSTEM_LEAVE') {
        delta = -1;
      }

      if (delta === 0 || baseMemberCount === undefined) {
        return;
      }

      setLiveMemberCountState((currentState) => {
        const isSameRoom = currentState.roomId === roomId;

        if (isSameRoom && currentState.processedMessageIds.has(message.id)) {
          return currentState;
        }

        const isSameBase = isSameRoom && currentState.baseCount === baseMemberCount;
        const currentCount = isSameBase ? currentState.count : baseMemberCount;

        if (currentCount === undefined || currentCount === null) {
          return currentState;
        }

        const processedMessageIds = isSameRoom
          ? new Set(currentState.processedMessageIds)
          : new Set<number>();
        processedMessageIds.add(message.id);

        return {
          baseCount: baseMemberCount,
          count: Math.max(0, currentCount + delta),
          processedMessageIds,
          roomId,
        };
      });
    },
    [baseMemberCount, roomId],
  );

  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      syncLiveMemberCount(message);

      if (message.type === 'SYSTEM_RIDE_ENDED') {
        onRideEnded?.();
      }

      if (onRideActionMessage(message)) {
        return;
      }

      if (hasNewMessages) {
        setNewMessagesState({
          cursor: afterCursor ?? newMessagesState.cursor,
          hasNewMessages: true,
          roomId,
        });
        return;
      }

      appendLiveMessage(createChatRoomMessageFromApi(message, currentUserId));
    },
    [
      afterCursor,
      appendLiveMessage,
      currentUserId,
      hasNewMessages,
      newMessagesState.cursor,
      onRideActionMessage,
      onRideEnded,
      roomId,
      syncLiveMemberCount,
    ],
  );

  const handleLoadNewerMessages = useCallback(async () => {
    const requestedCursor = afterCursor ?? null;

    await fetchNewerMessages();
    setNewMessagesState((currentState) => ({
      ...currentState,
      cursor: requestedCursor,
      hasNewMessages: false,
    }));
  }, [afterCursor, fetchNewerMessages]);

  const liveMessages = useMemo(() => {
    if (liveMessagesState.roomId !== roomId) {
      return [];
    }

    return liveMessagesState.messages.map((message) => {
      if (message.kind !== 'bubble' || message.senderId === undefined) {
        return message;
      }

      return {
        ...message,
        variant: message.senderId === currentUserId ? ('me' as const) : ('other' as const),
      };
    });
  }, [currentUserId, liveMessagesState, roomId]);

  const liveMemberCount =
    liveMemberCountState.roomId === roomId &&
    liveMemberCountState.baseCount === baseMemberCount &&
    liveMemberCountState.count !== null
      ? liveMemberCountState.count
      : null;

  return {
    handleLoadNewerMessages,
    handleWebSocketMessage,
    hasNewMessages,
    liveMemberCount,
    liveMessages,
  };
}
