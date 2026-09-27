'use client';

import { useQuery } from '@tanstack/react-query';

import {
  createTaxiPotChatEntryMessages,
  TaxiPotAnnouncement,
  taxiPotQueries,
  type TaxiPotChatEntryMessage,
} from '@/features/taxi-pot-chat';

import { useChatRoomQueries } from '@/_pages/chatting/api/chat-room';
import {
  createChatRoomFromApi,
  type ChatRoom,
  type ChatRoomMessage,
} from '@/_pages/chatting/model/chat-room';

import { ChatRoomContent } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';

export type ChattingPageProps = {
  roomId: string;
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
  const { detailQuery, messagesQuery } = useChatRoomQueries(roomId);
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

  if (
    detailQuery.isPending ||
    messagesQuery.isPending ||
    (taxiPotId !== undefined && taxiPotQuery.isPending)
  ) {
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
      <ChatRoomContent room={room} topContent={topContent} />
    </ChatRoomLayout>
  );
}
