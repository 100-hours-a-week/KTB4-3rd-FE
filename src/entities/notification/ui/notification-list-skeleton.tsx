import { cn } from '@/shared/lib/cn';

import { NotificationItemSkeleton } from './notification-item-skeleton';

export type NotificationListSkeletonProps = {
  className?: string;
  count?: number;
};

export function NotificationListSkeleton({ className, count = 5 }: NotificationListSkeletonProps) {
  return (
    <ul
      aria-busy="true"
      aria-label="알림을 불러오는 중"
      className={cn(
        'm-0 flex w-full list-none flex-col gap-2 bg-[var(--color-bg-layer-default)] p-0',
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <NotificationItemSkeleton key={index} />
      ))}
    </ul>
  );
}
