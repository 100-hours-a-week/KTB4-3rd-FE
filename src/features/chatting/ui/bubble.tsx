import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './bubble.module.css';

export type BubbleVariant = 'system' | 'me' | 'other';

export type BubbleProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode;
  loading?: boolean;
  variant?: BubbleVariant;
};

const variantClassNames: Record<BubbleVariant, string> = {
  system: 'bg-[var(--color-bg-brand-weak)] text-[color:var(--color-fg-neutral)]',
  me: 'bg-[var(--color-bg-brand-solid)] text-[color:var(--color-fg-neutral-inverted)]',
  other: 'bg-[var(--color-bg-neutral-weak)] text-[color:var(--color-fg-neutral)]',
};

const variantTextColors: Record<BubbleVariant, string> = {
  system: 'var(--color-fg-neutral)',
  me: 'var(--color-fg-neutral-inverted)',
  other: 'var(--color-fg-neutral)',
};

export function Bubble({
  children,
  className,
  loading = false,
  variant = 'other',
  ...props
}: BubbleProps) {
  const isLoading = loading && variant === 'system';

  return (
    <div
      {...props}
      aria-busy={isLoading || undefined}
      className={cn(
        'flex w-fit max-w-[301px] items-center rounded-[12px] px-4 py-3 text-[var(--font-size-t5)] leading-[var(--line-height-t5)] font-normal',
        '[&_p]:m-0 [overflow-wrap:anywhere]',
        variantClassNames[variant],
        isLoading && 'min-h-[74px] min-w-[281px]',
        className,
      )}
      data-variant={variant}
      role={isLoading ? 'status' : undefined}
    >
      <div className="min-w-0 break-words" style={{ color: variantTextColors[variant] }}>
        {children}
      </div>
      {isLoading ? (
        <span
          aria-hidden="true"
          className="ml-1 flex w-[43px] shrink-0 items-center justify-between"
        >
          <span
            className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.loadingDot)}
          />
          <span
            className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.loadingDot)}
          />
          <span
            className={cn('size-[10px] rounded-full bg-[var(--color-fg-brand)]', styles.loadingDot)}
          />
        </span>
      ) : null}
    </div>
  );
}
