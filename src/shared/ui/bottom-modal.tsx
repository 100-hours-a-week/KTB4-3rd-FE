'use client';

import Link, { type LinkProps } from 'next/link';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type BottomModalProps = {
  children: ReactNode;
  href: LinkProps['href'];
  open?: boolean;
  defaultOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

const modalClassName =
  'fixed bottom-2 left-1/2 z-50 h-[min(504px,calc(100dvh-16px))] w-[calc(100%_-_32px)] max-w-[361px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] shadow-[0_8px_12px_rgba(0,0,0,0.18)]';

const actionClassName =
  'inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] text-[var(--color-fg-neutral)] transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]';

/**
 * Content-first bottom modal with fixed header actions.
 *
 * The component can be used uncontrolled (it starts open and closes itself)
 * or controlled through `open` and `onOpenChange`.
 */
export function BottomModal({
  children,
  href,
  open,
  defaultOpen = true,
  onClose,
  onOpenChange,
  className,
}: BottomModalProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  const handleClose = () => {
    if (open === undefined) {
      setInternalOpen(false);
    }

    onClose?.();
    onOpenChange?.(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-label="바텀모달"
      aria-modal="true"
      className={cn(modalClassName, className)}
      data-testid="bottom-modal"
      role="dialog"
    >
      <header className="absolute inset-x-0 top-0 flex h-11 items-center justify-between">
        <button aria-label="닫기" className={actionClassName} onClick={handleClose} type="button">
          <Icon name="xmark" size={12} />
        </button>
        <Link aria-label="크게보기" className={actionClassName} href={href}>
          <Icon name="arrowUpRight" size={12} />
        </Link>
      </header>
      <div className="h-full overflow-y-auto pt-11">{children}</div>
    </div>
  );
}
