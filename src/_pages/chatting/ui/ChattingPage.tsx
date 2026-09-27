'use client';

import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  ChatRoomWebSocketConnection,
  type ChatRoomWebSocketConnectionValue,
} from '@/features/chatting';
import type { ChatWebSocketMessage } from '@/entities/chat';
import {
  createTaxiPotChatEntryMessages,
  TaxiPotAnnouncement,
  taxiPotQueries,
  type TaxiPotChatEntryMessage,
  type TaxiPotDetailData,
} from '@/features/taxi-pot-chat';

import { useChatRoomQueries } from '@/_pages/chatting/api/chat-room';
import {
  createChatRoomFromApi,
  createChatRoomMessageFromApi,
  type ChatRoom,
  type ChatRoomMessage,
} from '@/_pages/chatting/model/chat-room';

import { ChatRoomContent } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';

export type ChattingPageProps = {
  roomId: string;
};

type LiveMessagesState = {
  roomId: string;
  messages: ChatRoomMessage[];
};

function toChatRoomMessage(message: TaxiPotChatEntryMessage): ChatRoomMessage {
  return {
    id: message.id,
    kind: 'bubble',
    content: message.content,
    variant: message.variant,
    layout: message.layout === 'guide' ? 'large' : 'default',
    loading: message.loading,
  };
}

function formatDepartureTime(departureAt: string) {
  const departure = new Date(departureAt);

  if (Number.isNaN(departure.getTime())) {
    return '-';
  }

  return departure.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function ChattingPage({ roomId }: ChattingPageProps) {
  const [liveMessagesState, setLiveMessagesState] = useState<LiveMessagesState>({
    roomId,
    messages: [],
  });
  const { detailQuery, messagesQuery } = useChatRoomQueries(roomId);
  const handleWebSocketMessage = useCallback(
    (message: ChatWebSocketMessage) => {
      const nextMessage = createChatRoomMessageFromApi(message);

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
  const chatRoomDetail = detailQuery.data?.data;
  const taxiPotId =
    chatRoomDetail?.kind === 'TAXI_POT' ? String(chatRoomDetail.companion_id) : undefined;
  const taxiPotQuery = useQuery({
    ...taxiPotQueries.detail(taxiPotId ?? ''),
    enabled: taxiPotId !== undefined,
  });
  const taxiPotDetail = taxiPotQuery.data?.data;
  const baseRoom =
    chatRoomDetail && messagesQuery.data
      ? createChatRoomFromApi(chatRoomDetail, messagesQuery.data.data.items)
      : undefined;
  const taxiPotEntryMessages = taxiPotDetail
    ? createTaxiPotChatEntryMessages(taxiPotDetail).map(toChatRoomMessage)
    : [];
  const room: ChatRoom | undefined = baseRoom
    ? {
        ...baseRoom,
        memberCount: taxiPotDetail?.current_count ?? baseRoom.memberCount,
        memberLimit: taxiPotDetail?.capacity ?? baseRoom.memberLimit,
        messages: [...taxiPotEntryMessages, ...baseRoom.messages],
      }
    : undefined;
  const liveMessages = liveMessagesState.roomId === roomId ? liveMessagesState.messages : [];

  return (
    <ChatRoomWebSocketConnection roomId={roomId} onMessage={handleWebSocketMessage}>
      {(connection) => (
        <ChattingPageContent
          connection={connection}
          detailQuery={detailQuery}
          isTaxiPot={taxiPotId !== undefined}
          messagesQuery={messagesQuery}
          room={room}
          taxiPotDetail={taxiPotDetail}
          taxiPotQuery={taxiPotQuery}
          liveMessages={liveMessages}
        />
      )}
    </ChatRoomWebSocketConnection>
  );
}

type ChattingPageContentProps = {
  connection: ChatRoomWebSocketConnectionValue;
  detailQuery: ReturnType<typeof useChatRoomQueries>['detailQuery'];
  isTaxiPot: boolean;
  messagesQuery: ReturnType<typeof useChatRoomQueries>['messagesQuery'];
  taxiPotQuery: { isError: boolean; isPending: boolean };
  room?: ChatRoom;
  taxiPotDetail?: TaxiPotDetailData;
  liveMessages: readonly ChatRoomMessage[];
};

function ChattingPageContent({
  connection,
  detailQuery,
  isTaxiPot,
  messagesQuery,
  taxiPotQuery,
  room,
  taxiPotDetail,
  liveMessages,
}: ChattingPageContentProps) {
  if (detailQuery.isPending || messagesQuery.isPending || (isTaxiPot && taxiPotQuery.isPending)) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오는 중">채팅방을 불러오는 중이에요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || taxiPotQuery.isError || !room) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오지 못함">채팅방을 불러오지 못했어요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  const topContent = taxiPotDetail ? (
    <TaxiPotAnnouncement
      className="absolute top-1.5 left-3 z-10 w-[calc(100%-24px)]"
      departureTime={formatDepartureTime(taxiPotDetail.departure_at)}
    />
  ) : null;

  return (
    <ChatRoomLayout room={room}>
      <ChatRoomContent
        connection={connection}
        liveMessages={liveMessages}
        room={room}
        topContent={topContent}
      />
    </ChatRoomLayout>
  );
}
