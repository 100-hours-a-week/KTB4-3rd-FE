import type { BubbleVariant } from '@/features/chatting';

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
  title: string;
  memberCount: number;
  memberLimit: number;
  messages: ChatRoomMessage[];
};

export const generalChatRoom: ChatRoom = {
  id: 'general-1',
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
