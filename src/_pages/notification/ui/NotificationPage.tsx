'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import {
  NotificationList,
  NotificationListSkeleton,
  type Notification,
} from '@/entities/notification';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationListQuery,
} from '@/features/notification-center';
import { PushNotificationPlatformGuide } from '@/features/push-token';
import { BackButton } from '@/shared/ui/back-button';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Button } from '@/shared/ui/button';
import { ChipTabs, type ChipTabOption } from '@/shared/ui/chip-tabs';
import { Header } from '@/shared/ui/header';
import { Icon } from '@/shared/ui/icon';
import { PageLayout } from '@/shared/ui/page-layout';
import { ResultSection } from '@/shared/ui/result-section';

export type NotificationTabValue = 'all' | 'unread';

export type NotificationPageProps = {
  activeTab?: NotificationTabValue;
  hasNextPage?: boolean;
  initialTab?: NotificationTabValue;
  isError?: boolean;
  isFetchingNextPage?: boolean;
  isMarkingAllRead?: boolean;
  isLoading?: boolean;
  notifications?: readonly Notification[];
  onLoadMore?: () => void;
  onMarkAllRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onRetry?: () => void;
  onTabChange?: (tab: NotificationTabValue) => void;
};

const CARPOOL_REQUEST_RECEIVED_ROUTE = '/chat?tab=carpool&direction=RECEIVED';

const NOTIFICATION_TAB_OPTIONS: readonly ChipTabOption<NotificationTabValue>[] = [
  { label: '전체', value: 'all', widthClassName: 'w-[68px]' },
  { label: '안읽음', value: 'unread', widthClassName: 'w-[80px]' },
];

export function NotificationPageView({
  activeTab: controlledActiveTab,
  hasNextPage = false,
  initialTab = 'all',
  isError = false,
  isFetchingNextPage = false,
  isMarkingAllRead = false,
  isLoading = false,
  notifications = [],
  onLoadMore,
  onMarkAllRead,
  onNotificationClick,
  onRetry,
  onTabChange,
}: NotificationPageProps) {
  const [localActiveTab, setLocalActiveTab] = useState(initialTab);
  const activeTab = controlledActiveTab ?? localActiveTab;
  const listScrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const visibleNotifications =
    activeTab === 'unread'
      ? notifications.filter(({ read_at }) => read_at === null)
      : notifications;
  let listContent: ReactNode = null;

  useEffect(() => {
    const target = loadMoreRef.current;
    const scrollElement = listScrollRef.current;

    if (
      !target ||
      !scrollElement ||
      !hasNextPage ||
      !onLoadMore ||
      isFetchingNextPage ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: scrollElement, rootMargin: '0px 0px 120px 0px' },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore, visibleNotifications.length]);

  if (isLoading) {
    listContent = (
      <NotificationListSkeleton
        className="mt-5 min-h-0 flex-1 gap-[10px] overflow-y-auto"
        count={5}
      />
    );
  } else if (isError && visibleNotifications.length === 0) {
    listContent = (
      <div className="mt-5 flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
        <ResultSection
          buttons="primary"
          className="shrink-0"
          description={'불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.'}
          icon={
            <Icon color="var(--color-fg-critical)" name="exclamationmarkCircleFill" size={66} />
          }
          primaryButtonProps={{ onClick: onRetry }}
          primaryLabel="다시 불러오기"
          size="medium"
          title="알림을 불러올 수 없어요"
        />
      </div>
    );
  } else if (visibleNotifications.length > 0) {
    listContent = (
      <div
        className="mt-5 min-h-0 flex-1 overflow-y-auto"
        data-testid="notification-list-scroll-region"
        ref={listScrollRef}
      >
        <NotificationList
          className="!mt-0"
          items={visibleNotifications}
          onItemClick={onNotificationClick}
        />
        {hasNextPage ? (
          <div
            aria-busy={isFetchingNextPage}
            aria-live="polite"
            className="flex min-h-8 items-center justify-center py-2"
            data-testid="notification-list-load-more"
            ref={loadMoreRef}
          >
            {isFetchingNextPage ? '알림을 불러오는 중이에요.' : null}
          </div>
        ) : null}
      </div>
    );
  } else {
    listContent = (
      <div className="mt-5 flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
        <ResultSection
          className="shrink-0"
          description="알림이 오면 알려드릴게요"
          icon={<Icon color="var(--color-fg-neutral-muted)" name="notificationEmpty" size={66} />}
          size="medium"
          title="새로운 알림이 없어요"
        />
      </div>
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
          onValueChange={(tab) => {
            if (controlledActiveTab === undefined) {
              setLocalActiveTab(tab);
            }
            onTabChange?.(tab);
          }}
          options={NOTIFICATION_TAB_OPTIONS}
          value={activeTab}
        />

        <PushNotificationPlatformGuide />

        {!isError && (isLoading || visibleNotifications.length > 0) ? (
          <div className="mt-5 flex justify-end pr-3">
            <Button
              loading={isMarkingAllRead}
              onClick={onMarkAllRead}
              size="xsmall"
              textVariant="t2Bold"
              variant="brand-solid"
            >
              모두 읽기
            </Button>
          </div>
        ) : null}

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
  return <NotificationPageView isLoading />;
}

export function NotificationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<NotificationTabValue>('all');
  const query = useNotificationListQuery(activeTab);
  const { isPending: isMarkingAllRead, mutate: markAllNotificationsRead } =
    useMarkAllNotificationsReadMutation();
  const { mutate: markNotificationRead } = useMarkNotificationReadMutation();
  const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isLoading, refetch } =
    query;
  const notifications = data?.pages.flatMap(({ data: pageData }) => pageData.notifications) ?? [];
  const maxNotificationId = notifications.reduce<number | null>(
    (maxId, notification) => (maxId === null ? notification.id : Math.max(maxId, notification.id)),
    null,
  );
  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const onMarkAllRead = useCallback(() => {
    if (isMarkingAllRead || maxNotificationId === null) {
      return;
    }

    markAllNotificationsRead({ max_notification_id: maxNotificationId });
  }, [isMarkingAllRead, markAllNotificationsRead, maxNotificationId]);
  const onNotificationClick = useCallback(
    (notification: Notification) => {
      markNotificationRead(notification.id);

      if (notification.type === 'CARPOOL_REQUEST_RECEIVED') {
        router.push(CARPOOL_REQUEST_RECEIVED_ROUTE);
        return;
      }

      if (notification.target_post_id !== null) {
        router.push(`/posts/${notification.target_post_id}`);
        return;
      }

      if (notification.target_chat_room_id !== null) {
        router.push(`/chatroom/${notification.target_chat_room_id}`);
      }
    },
    [markNotificationRead, router],
  );

  return (
    <NotificationPageView
      activeTab={activeTab}
      hasNextPage={hasNextPage}
      isError={isError && notifications.length === 0}
      isFetchingNextPage={isFetchingNextPage}
      isMarkingAllRead={isMarkingAllRead}
      isLoading={isLoading}
      notifications={notifications}
      onLoadMore={onLoadMore}
      onMarkAllRead={onMarkAllRead}
      onNotificationClick={onNotificationClick}
      onRetry={() => void refetch()}
      onTabChange={setActiveTab}
    />
  );
}
