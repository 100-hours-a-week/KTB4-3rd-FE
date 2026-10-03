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
  bottomOffset?: number | string;
  className?: string;
};

const modalClassName =
  'fixed left-1/2 z-50 flex h-[min(504px,calc(100dvh-16px))] min-h-0 min-w-0 w-[calc(100vw_-_32px)] max-w-[361px] -translate-x-1/2 flex-col overflow-hidden rounded-[24px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] shadow-[0_8px_12px_rgba(0,0,0,0.18)]';
const backdropClassName = 'fixed inset-0 z-40 min-h-dvh border-0 bg-transparent p-0';

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
  bottomOffset = '8px',
  className,
}: BottomModalProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const resolvedBottomOffset =
    typeof bottomOffset === 'number' ? `${bottomOffset}px` : bottomOffset;

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
    <>
      <button
        aria-label="바텀모달 배경 닫기"
        className={backdropClassName}
        data-testid="bottom-modal-backdrop"
        onClick={handleClose}
        type="button"
      />
      <div
        aria-label="바텀모달"
        aria-modal="true"
        className={cn(modalClassName, className)}
        data-testid="bottom-modal"
        role="dialog"
        style={{
          bottom: resolvedBottomOffset,
          maxHeight: `calc(100dvh - ${resolvedBottomOffset} - 8px)`,
        }}
      >
        <header className="flex h-11 shrink-0 items-center justify-between bg-[var(--color-bg-layer-default)]">
          <button aria-label="닫기" className={actionClassName} onClick={handleClose} type="button">
            <Icon name="xmark" size={12} />
          </button>
          <Link aria-label="크게보기" className={actionClassName} href={href} prefetch>
            <Icon name="arrowUpRight" size={12} />
          </Link>
        </header>
        <div
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
          data-testid="bottom-modal-content"
        >
          {children}
        </div>
      </div>
    </>
  );
}
