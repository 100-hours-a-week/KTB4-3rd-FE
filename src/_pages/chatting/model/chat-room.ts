import type { BubbleVariant } from '@/features/chatting';

import type { ChatRoomDetailData, ChatRoomMessageData } from '@/_pages/chatting/api/chat-room';

export type ChatRoomMessage =
  | {
      id: string;
      kind: 'bubble';
      content: string;
      variant: Exclude<BubbleVariant, 'system'>;
      layout?: 'default' | 'tall';
    }
  | {
      id: string;
      kind: 'notice';
      content: string;
    };

export type ChatRoom = {
  id: string;
  lastReadMessageId: number | null;
  title: string;
  memberCount: number;
  memberLimit: number;
  messages: ChatRoomMessage[];
};

export const generalChatRoom: ChatRoom = {
  id: 'general-1',
  lastReadMessageId: null,
  title: '5시 판교역',
  memberCount: 1,
  memberLimit: 4,
  messages: [
    {
      id: 'first-user',
      kind: 'bubble',
      content: '첫번째 유저예요!',
      variant: 'other',
    },
    {
      id: 'finding-companion',
      kind: 'bubble',
      content: '같이 갈 사람을 찾는 중이에요.',
      variant: 'other',
      layout: 'tall',
    },
    {
      id: 'user-joined',
      kind: 'notice',
      content: 'ㅇㅇ 님이 입장하셨어요',
    },
    {
      id: 'greeting',
      kind: 'bubble',
      content: '안녕하세요',
      variant: 'me',
    },
    {
      id: 'meeting-place',
      kind: 'bubble',
      content: '어디서 만나실건가요',
      variant: 'other',
    },
  ],
};

export function createChatRoom(id: string): ChatRoom {
  return {
    ...generalChatRoom,
    id,
  };
}

function getSystemMessageContent(message: ChatRoomMessageData) {
  if (message.type === 'SYSTEM_JOIN') {
    return message.joiner
      ? `${message.joiner.name} 님이 입장하셨어요`
      : '새로운 멤버가 입장하셨어요';
  }

  if (message.type === 'SYSTEM_RIDE_START_REQUESTED') {
    return '탑승 시작 요청이 등록되었어요';
  }

  return message.content ?? '채팅방 시스템 알림';
}

function mapChatRoomMessage(message: ChatRoomMessageData): ChatRoomMessage {
  if (message.type === 'TEXT') {
    return {
      id: String(message.id),
      kind: 'bubble',
      content: message.content ?? '',
      variant: 'other',
    };
  }

  return {
    id: String(message.id),
    kind: 'notice',
    content: getSystemMessageContent(message),
  };
}

export function createChatRoomFromApi(
  detail: ChatRoomDetailData,
  messages: readonly ChatRoomMessageData[],
): ChatRoom {
  return {
    id: String(detail.id),
    lastReadMessageId: detail.last_read_message_id,
    title: detail.title,
    memberCount: detail.current_count,
    memberLimit: detail.capacity,
    messages: [...messages].reverse().map(mapChatRoomMessage),
  };
}
