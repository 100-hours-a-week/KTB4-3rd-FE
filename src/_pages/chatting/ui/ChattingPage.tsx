'use client';

import { useChatRoomQueries } from '@/_pages/chatting/api/chat-room';
import { createChatRoomFromApi } from '@/_pages/chatting/model/chat-room';

import { ChatRoomContent } from './chat-room-content';
import { ChatRoomLayout } from './chat-room-layout';
import { ChatRoomState } from './chat-room-state';

export type ChattingPageProps = {
  roomId: string;
};

export function ChattingPage({ roomId }: ChattingPageProps) {
  const { detailQuery, messagesQuery } = useChatRoomQueries(roomId);
  const room =
    detailQuery.data && messagesQuery.data
      ? createChatRoomFromApi(detailQuery.data.data, messagesQuery.data.data.items)
      : undefined;

  if (detailQuery.isPending || messagesQuery.isPending) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오는 중">채팅방을 불러오는 중이에요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  if (detailQuery.isError || messagesQuery.isError || !room) {
    return (
      <ChatRoomLayout>
        <ChatRoomState label="채팅방을 불러오지 못함">채팅방을 불러오지 못했어요.</ChatRoomState>
      </ChatRoomLayout>
    );
  }

  return (
    <ChatRoomLayout room={room}>
      <ChatRoomContent
        key={`${room.id}:${room.messages.map((message) => message.id).join(',')}`}
        room={room}
      />
    </ChatRoomLayout>
  );
}
