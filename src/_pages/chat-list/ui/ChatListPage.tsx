import { Suspense } from 'react';

import type { CarpoolRequestDirection, ChatCarpoolTab } from '@/entities/carpool';
import { BackButton } from '@/shared/ui/back-button';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';

import { type ChatListPageStates } from '@/_pages/chat-list/model/chat-list-state';
import { ChatListPageContent, ChatListPageContentWithQuery } from './chat-list-page-content';
import { ChatListPageContentLoading } from './chat-list-page-loading';

export type ChatListPageProps = {
  initialChatTab?: ChatCarpoolTab;
  initialRequestDirection?: CarpoolRequestDirection;
  states?: ChatListPageStates;
};

export function ChatListPage({
  initialChatTab = 'chat',
  initialRequestDirection = 'SENT',
  states,
}: ChatListPageProps) {
  return (
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="relative !overflow-hidden !px-5 !pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
      header={<Header leftSlot={<BackButton href="/" />} />}
    >
      <Suspense fallback={<ChatListPageContentLoading />}>
        {states ? (
          <ChatListPageContent states={states} />
        ) : (
          <ChatListPageContentWithQuery
            initialChatTab={initialChatTab}
            initialRequestDirection={initialRequestDirection}
          />
        )}
      </Suspense>
      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
      <SnackbarViewport className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5" />
    </PageLayout>
  );
}
