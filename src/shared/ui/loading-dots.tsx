import { cn } from '@/shared/lib/cn';

import styles from './loading-dots.module.css';

export type LoadingDotsProps = {
  className?: string;
};

export function LoadingDots({ className }: LoadingDotsProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex w-[43px] shrink-0 items-center justify-between', className)}
      data-component="loading-dots"
    >
      <span className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.dot)} />
      <span className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.dot)} />
      <span className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.dot)} />
    </span>
  );
}
