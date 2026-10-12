import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

import type { Notification } from '../model/notification';
import { NotificationItem } from './notification-item';

export type NotificationListProps = {
  className?: string;
  items: readonly Notification[];
  now?: Date;
  onItemClick?: (notification: Notification) => void;
};

export function NotificationList({ className, items, now, onItemClick }: NotificationListProps) {
  if (items.length === 0) {
    return (
      <Text
        as="p"
        className={cn('w-full bg-[var(--color-bg-layer-default)] py-8 text-center', className)}
        color="fg.neutralMuted"
      >
        알림이 없습니다.
      </Text>
    );
  }

  return (
    <ul
      className={cn(
        'm-0 flex w-full list-none flex-col gap-2 bg-[var(--color-bg-layer-default)] p-0',
        className,
      )}
    >
      {items.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          now={now}
          onClick={onItemClick ? () => onItemClick(notification) : undefined}
        />
      ))}
    </ul>
  );
}
