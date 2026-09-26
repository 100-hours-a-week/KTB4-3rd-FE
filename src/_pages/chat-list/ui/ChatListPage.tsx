import { Suspense } from 'react';

import { BackButton } from '@/shared/ui/back-button';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';

import {
  DEFAULT_CHAT_LIST_STATES,
  type ChatListPageStates,
} from '@/_pages/chat-list/model/chat-list-state';
import { ChatListPageContent } from './chat-list-page-content';
import { ChatListPageContentLoading } from './chat-list-page-loading';

export type ChatListPageProps = {
  states?: ChatListPageStates;
};

export function ChatListPage({ states = DEFAULT_CHAT_LIST_STATES }: ChatListPageProps) {
  return (
    <PageLayout
      className="relative min-h-dvh overflow-hidden"
      contentClassName="relative !px-5 !pt-8 !pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
      header={<Header leftSlot={<BackButton href="/" />} title="채팅" />}
    >
      <Suspense fallback={<ChatListPageContentLoading />}>
        <ChatListPageContent states={states} />
      </Suspense>
      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
    </PageLayout>
  );
}
