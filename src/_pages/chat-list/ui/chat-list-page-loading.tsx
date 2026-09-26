import { ChatListTabs } from '@/entities/chat';
import { BackButton } from '@/shared/ui/back-button';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';

const SKELETON_ROWS = Array.from({ length: 6 }, (_, index) => index);

export function ChatListPageContentLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="채팅 목록을 불러오는 중"
      className="flex min-h-0 flex-1 flex-col"
    >
      <ChatListTabs />
      <div className="mt-8 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="m-0 w-full list-none p-0">
          {SKELETON_ROWS.map((row) => (
            <li
              aria-hidden="true"
              className="flex h-[84px] w-full items-start border-b border-[var(--color-stroke-neutral-subtle)] pt-[18px]"
              key={row}
            >
              <div className="size-12 shrink-0 animate-pulse rounded-full bg-[var(--color-bg-neutral-weak)]" />
              <div className="flex flex-1 flex-col gap-2 pt-[1px] pl-4">
                <div className="h-5 w-3/5 animate-pulse rounded bg-[var(--color-bg-neutral-weak)]" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-[var(--color-bg-neutral-weak)]" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ChatListPageLoading() {
  return (
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="relative !px-5 !pt-8 !pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
      header={<Header leftSlot={<BackButton href="/" />} title="채팅" />}
    >
      <ChatListPageContentLoading />
      <BottomNav className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2" />
    </PageLayout>
  );
}
