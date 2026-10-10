'use client';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import Link, { type LinkProps } from 'next/link';
import { useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type BottomModalProps = {
  children: ReactNode;
  href?: LinkProps['href'];
  showExpand?: boolean;
  closeDisabled?: boolean;
  finalFocus?: BaseDialog.Popup.Props['finalFocus'];
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
 * 기본 사용 시 모달이 열림 여부를 관리합니다.
 * `open`을 전달하면 부모가 닫기 요청을 받아 열림 여부를 결정합니다.
 */
export function BottomModal({
  children,
  href,
  showExpand = true,
  closeDisabled = false,
  finalFocus,
  open,
  defaultOpen = true,
  onClose,
  onOpenChange,
  bottomOffset = '8px',
  className,
}: BottomModalProps) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = open ?? internalOpen;
  const resolvedBottomOffset =
    typeof bottomOffset === 'number' ? `${bottomOffset}px` : bottomOffset;

  const keepFocusWhenLocked = (event: SyntheticEvent) => {
    if (closeDisabled) {
      event.preventDefault();
    }
  };

  return (
    <BaseDialog.Root
      open={isOpen}
      disablePointerDismissal={closeDisabled}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && closeDisabled) {
          eventDetails.cancel();
          return;
        }
        if (open === undefined) {
          setInternalOpen(nextOpen);
        }
        if (!nextOpen) {
          onClose?.();
        }
        onOpenChange?.(nextOpen);
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className={backdropClassName}
          data-testid="bottom-modal-backdrop"
          onPointerDown={keepFocusWhenLocked}
          onMouseDown={keepFocusWhenLocked}
        />
        <BaseDialog.Popup
          aria-label="바텀모달"
          className={cn(modalClassName, 'outline-none', className)}
          data-testid="bottom-modal"
          ref={popupRef}
          initialFocus={popupRef}
          finalFocus={finalFocus}
          style={{
            bottom: resolvedBottomOffset,
            maxHeight: `calc(100dvh - ${resolvedBottomOffset} - 8px)`,
          }}
        >
          <header className="flex h-11 shrink-0 items-center justify-between bg-[var(--color-bg-layer-default)]">
            <BaseDialog.Close
              aria-label="닫기"
              className={cn(actionClassName, 'disabled:cursor-not-allowed disabled:opacity-50')}
              disabled={closeDisabled}
              type="button"
            >
              <Icon name="xmark" size={12} />
            </BaseDialog.Close>
            {showExpand && href !== undefined ? (
              <Link aria-label="크게보기" className={actionClassName} href={href} prefetch>
                <Icon name="arrowUpRight" size={12} />
              </Link>
            ) : null}
          </header>
          <div
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
            data-testid="bottom-modal-content"
          >
            {children}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
