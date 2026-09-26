import { redirect } from 'next/navigation';

import { generalChatRoom } from '@/_pages/chatting';

export default function ChattingRoute() {
  redirect(`/chatroom/${generalChatRoom.id}`);
}
