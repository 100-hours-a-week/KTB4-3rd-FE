import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Skeleton } from '@/shared/ui/skeleton';

const NEARBY_LIST_SKELETON_ROWS = Array.from({ length: 4 }, (_, index) => index);

export function NearbyListSkeleton({
  className,
  label = '근처 핀 게시글을 불러오는 중',
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={cn('flex flex-col', className)}
      data-testid="nearby-posts-skeleton"
    >
      {NEARBY_LIST_SKELETON_ROWS.map((row) => (
        <div
          className="relative flex h-[72px] items-center border-b border-[var(--color-stroke-neutral-subtle)] px-4"
          key={row}
        >
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="ml-[11px] flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-[22px] w-[200px] max-w-full" />
            <Skeleton className="h-[18px] w-[183px] max-w-full" />
          </div>
          <Icon
            aria-hidden="true"
            className="shrink-0"
            color="var(--color-fg-neutral-muted)"
            name="chevronRight"
            size={18}
          />
        </div>
      ))}
    </div>
  );
}
