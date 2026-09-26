import { ChattingPage } from '@/_pages/chatting';

type ChatRoomRouteProps = {
  params: Promise<{
    chatroomId: string;
  }>;
};

export default async function ChatRoomRoute({ params }: ChatRoomRouteProps) {
  const { chatroomId } = await params;

  return <ChattingPage roomId={chatroomId} />;
}
