import type { Metadata } from 'next';

import {
  ChatListPage,
  parseChatListRouteState,
  type ChatListRouteParams,
} from '@/_pages/chat-list';

export const metadata: Metadata = {
  title: '채팅',
};

type ChatPageProps = {
  searchParams: Promise<ChatListRouteParams>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const routeState = parseChatListRouteState(await searchParams);

  return (
    <ChatListPage
      initialChatTab={routeState.chatTab}
      initialRequestDirection={routeState.requestDirection}
    />
  );
}
