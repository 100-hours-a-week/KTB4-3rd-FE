import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/skeleton';

export type NotificationItemSkeletonProps = {
  className?: string;
};

export function NotificationItemSkeleton({ className }: NotificationItemSkeletonProps) {
  return (
    <li
      aria-hidden="true"
      className={cn(
        'relative h-[84px] w-full list-none rounded-2xl border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]',
        className,
      )}
    >
      <span className="absolute top-[30px] right-[83px] left-[11px] block h-[22px]">
        <Skeleton className="h-full w-full" />
      </span>
      <span className="absolute top-[11px] right-[11px] block h-[22px] w-[50px]">
        <Skeleton className="h-full w-full" />
      </span>
      <span className="absolute right-3 bottom-3 block h-6 w-[50px] overflow-hidden rounded-full bg-[var(--color-bg-neutral-weak)]">
        <Skeleton className="h-full w-full" />
      </span>
    </li>
  );
}
