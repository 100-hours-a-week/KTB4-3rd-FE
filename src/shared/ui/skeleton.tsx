import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/cn';

export type SkeletonProps = ComponentPropsWithoutRef<'div'>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-[8px] bg-[var(--color-bg-neutral-weak)]', className)}
    />
  );
}
