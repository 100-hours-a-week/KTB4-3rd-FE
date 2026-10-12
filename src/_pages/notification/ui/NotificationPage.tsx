'use client';

import { useState, type ReactNode } from 'react';

import {
  NotificationList,
  NotificationListSkeleton,
  type Notification,
} from '@/entities/notification';
import { BackButton } from '@/shared/ui/back-button';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Button } from '@/shared/ui/button';
import { ChipTabs, type ChipTabOption } from '@/shared/ui/chip-tabs';
import { Header } from '@/shared/ui/header';
import { PageLayout } from '@/shared/ui/page-layout';

export type NotificationTabValue = 'all' | 'unread';

export type NotificationPageProps = {
  initialTab?: NotificationTabValue;
  isLoading?: boolean;
  notifications?: readonly Notification[];
  onMarkAllRead?: () => void;
};

const NOTIFICATION_TAB_OPTIONS: readonly ChipTabOption<NotificationTabValue>[] = [
  { label: '전체', value: 'all', widthClassName: 'w-[68px]' },
  { label: '안읽음', value: 'unread', widthClassName: 'w-[80px]' },
];

export function NotificationPage({
  initialTab = 'all',
  isLoading = false,
  notifications = [],
  onMarkAllRead,
}: NotificationPageProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const visibleNotifications =
    activeTab === 'unread'
      ? notifications.filter(({ read_at }) => read_at === null)
      : notifications;
  let listContent: ReactNode = null;

  if (isLoading) {
    listContent = (
      <NotificationListSkeleton
        className="mt-5 min-h-0 flex-1 gap-[10px] overflow-y-auto"
        count={5}
      />
    );
  } else if (visibleNotifications.length > 0) {
    listContent = (
      <NotificationList
        className="mt-5 min-h-0 flex-1 overflow-y-auto"
        items={visibleNotifications}
      />
    );
  }

  return (
    <PageLayout
      className="relative h-dvh min-h-0 overflow-hidden"
      contentClassName="relative !overflow-hidden !px-5 !pb-[calc(72px+env(safe-area-inset-bottom,0px))]"
      header={<Header leftSlot={<BackButton href="/" />} title="알림" />}
    >
      <section aria-label="알림" className="flex min-h-0 flex-1 flex-col">
        <ChipTabs
          ariaLabel="알림 필터"
          className="mt-8"
          onValueChange={setActiveTab}
          options={NOTIFICATION_TAB_OPTIONS}
          value={activeTab}
        />

        <div className="mt-5 flex justify-end pr-3">
          <Button onClick={onMarkAllRead} size="xsmall" textVariant="t2Bold" variant="brand-solid">
            모두 읽기
          </Button>
        </div>

        {listContent}
      </section>
      <BottomNav
        activeItem="chatting"
        className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2"
      />
    </PageLayout>
  );
}

export function NotificationPageLoading() {
  return <NotificationPage isLoading />;
}
