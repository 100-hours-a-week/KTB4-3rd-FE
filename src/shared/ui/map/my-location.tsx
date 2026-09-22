import type { ButtonHTMLAttributes, HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

export function MyLocation({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      aria-label="현재 위치"
      className={cn(
        'relative block size-[52px] rounded-full bg-white/80 shadow-[0_2px_10px_rgba(0,0,0,0.08)]',
        className,
      )}
      data-testid="my-location"
      role="img"
    >
      <span className="absolute top-[15px] left-[15px] size-[22px] rounded-full border-4 border-white bg-[var(--color-bg-brand-solid)]" />
    </span>
  );
}

export type MyLocationButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function MyLocationButton({ className, ...props }: MyLocationButtonProps) {
  return (
    <button
      {...props}
      aria-label={props['aria-label'] ?? '현재 위치로 이동'}
      className={cn(
        'flex size-12 items-center justify-center rounded-full border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-brand)] shadow-[2px_2px_4px_rgba(0,0,0,0.16)] transition-colors hover:bg-[var(--color-bg-layer-default-pressed)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] active:bg-[var(--color-bg-layer-default-pressed)]',
        className,
      )}
      data-testid="my-location-button"
      type="button"
    >
      <Icon name="crosshair" size={24} />
    </button>
  );
}
