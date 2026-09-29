import type { Metadata } from 'next';

import { ChatListPage } from '@/_pages/chat-list';

export const metadata: Metadata = {
  title: '채팅',
};

export default function ChatPage() {
  return <ChatListPage />;
}
