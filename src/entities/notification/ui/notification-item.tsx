import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

import { formatNotificationTime } from '../model/format-notification-time';
import { notificationCategoryLabels, type Notification } from '../model/notification';

export type NotificationItemProps = {
  className?: string;
  notification: Notification;
  now?: Date;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  state?: 'default' | 'clicked';
};

export function NotificationItem({
  className,
  notification,
  now,
  onClick,
  state = 'default',
}: NotificationItemProps) {
  const isRead = notification.read_at !== null;
  const isClicked = state === 'clicked';

  return (
    <li className={cn('h-[84px] w-full shrink-0 list-none', className)}>
      <button
        className={cn(
          'relative block h-full w-full min-w-0 appearance-none rounded-2xl p-0 text-left',
          'transition-colors active:bg-[var(--color-bg-transparent-selected-pressed)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
          isRead || isClicked
            ? 'bg-[var(--color-bg-transparent-selected)]'
            : 'border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]',
        )}
        data-notification-id={notification.id}
        data-read={isRead}
        data-state={state}
        onClick={onClick}
        type="button"
      >
        <Text
          as="span"
          className="absolute top-[31px] right-[86px] left-3 block truncate"
          color={isRead ? 'fg.disabled' : 'fg.neutral'}
          variant="t5Regular"
        >
          {notification.content}
        </Text>

        <time
          className="absolute top-[11px] right-3 whitespace-nowrap"
          dateTime={notification.created_at}
        >
          <Text as="span" color={isRead ? 'fg.disabled' : 'fg.neutralMuted'} variant="t4Regular">
            {formatNotificationTime(notification.created_at, now)}
          </Text>
        </time>

        <span className="absolute right-3 bottom-3 inline-flex h-6 w-[50px] items-center justify-center rounded-full bg-[var(--color-bg-neutral-weak)]">
          <Text
            as="span"
            className={isRead ? 'opacity-50' : undefined}
            color="fg.brand"
            variant="t3Regular"
          >
            {notificationCategoryLabels[notification.type]}
          </Text>
        </span>
      </button>
    </li>
  );
}
