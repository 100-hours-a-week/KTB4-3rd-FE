import { notFound } from 'next/navigation';

import { ChattingPage, generalChatRoom } from '@/_pages/chatting';

type ChatRoomRouteProps = {
  params: Promise<{
    chatroomId: string;
  }>;
};

export default async function ChatRoomRoute({ params }: ChatRoomRouteProps) {
  const { chatroomId } = await params;

  if (chatroomId !== generalChatRoom.id) {
    notFound();
  }

  return <ChattingPage room={generalChatRoom} />;
}
