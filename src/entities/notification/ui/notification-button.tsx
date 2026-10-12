import Image from 'next/image';
import type { MouseEventHandler } from 'react';

import { cn } from '@/shared/lib/cn';

export type NotificationButtonProps = {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export function NotificationButton({ className, onClick }: NotificationButtonProps) {
  return (
    <button
      aria-label="알림 열기"
      className={cn(
        'relative inline-flex size-[42px] shrink-0 items-center justify-center rounded-full p-0',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="absolute inset-0"
        height={42}
        src="/icons/notification/notification-button-background.svg"
        unoptimized
        width={42}
      />
      <span className="absolute top-[9px] left-[9px] size-6 overflow-hidden">
        <Image
          alt=""
          aria-hidden="true"
          className="absolute top-px left-[2.5px]"
          height={22}
          src="/icons/notification/notification-bell.svg"
          unoptimized
          width={19}
        />
      </span>
    </button>
  );
}
