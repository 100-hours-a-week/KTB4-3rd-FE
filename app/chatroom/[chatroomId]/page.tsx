import type { Metadata } from 'next';

import { ChattingPage } from '@/_pages/chatting';

export const metadata: Metadata = {
  title: '채팅',
};

type ChatRoomRouteProps = {
  params: Promise<{
    chatroomId: string;
  }>;
};

export default async function ChatRoomRoute({ params }: ChatRoomRouteProps) {
  const { chatroomId } = await params;

  return <ChattingPage roomId={chatroomId} />;
}
