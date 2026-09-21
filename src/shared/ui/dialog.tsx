'use client';

import { Dialog as BaseDialog, type DialogRootActions } from '@base-ui/react/dialog';
import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Button, type ButtonProps } from './button';
import { Icon } from './icon';
import { Text } from './text';

export type DialogButtons = 'none' | 'primary' | 'primarySecondary';

export type DialogButtonProps = Omit<ButtonProps, 'children' | 'size' | 'variant' | 'width'>;

export type DialogProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;

  buttons?: DialogButtons;
  primaryLabel?: ReactNode;
  secondaryLabel?: ReactNode;
  primaryButtonProps?: DialogButtonProps;
  secondaryButtonProps?: DialogButtonProps;

  showCloseButton?: boolean;
  closeButtonLabel?: string;
  trigger?: ReactElement;

  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean | 'trap-focus';
  closeOnBackdropClick?: boolean;
  disablePointerDismissal?: boolean;
  className?: string;
};

type ScrollState = {
  canScroll: boolean;
  isScrolled: boolean;
  isAtBottom: boolean;
};

const actionButtonClassName = 'min-w-0 flex-1';

function readScrollState(element: HTMLDivElement): ScrollState {
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

  return {
    canScroll: maxScrollTop > 0,
    isScrolled: element.scrollTop > 0,
    isAtBottom: maxScrollTop === 0 || element.scrollTop >= maxScrollTop - 1,
  };
}

function DialogActionButton({
  actionProps,
  label,
  onClose,
  variant,
}: {
  actionProps?: DialogButtonProps;
  label: ReactNode;
  onClose: () => void;
  variant: 'brand-solid' | 'neutral-weak';
}) {
  const handleClick: NonNullable<DialogButtonProps['onClick']> = (event) => {
    actionProps?.onClick?.(event);

    if (!event.defaultPrevented) {
      onClose();
    }
  };

  return (
    <Button
      {...actionProps}
      className={cn(actionButtonClassName, actionProps?.className)}
      onClick={handleClick}
      size="large"
      variant={variant}
      width="fill"
    >
      {label}
    </Button>
  );
}

/**
 * Centered modal dialog with a fixed header/footer and a scrollable body.
 *
 * The default action matches the design's primary-only variant. Set
 * `buttons="primarySecondary"` to render the secondary action as well, or
 * `buttons="none"` for an information dialog that only uses the close button.
 */
export function Dialog({
  title,
  description,
  children,
  buttons = 'primary',
  primaryLabel = '확인',
  secondaryLabel = '취소',
  primaryButtonProps,
  secondaryButtonProps,
  showCloseButton = true,
  closeButtonLabel = '닫기',
  trigger,
  open,
  defaultOpen = false,
  onOpenChange,
  modal = true,
  closeOnBackdropClick,
  disablePointerDismissal = false,
  className,
}: DialogProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScroll: false,
    isScrolled: false,
    isAtBottom: true,
  });
  const bodyRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<DialogRootActions | null>(null);

  const updateScrollState = useCallback(() => {
    const body = bodyRef.current;

    if (!body) {
      return;
    }

    setScrollState(readScrollState(body));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    updateScrollState();

    const body = bodyRef.current;

    if (!body || typeof ResizeObserver === 'undefined') {
      return;
    }

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(body);

    return () => resizeObserver.disconnect();
  }, [children, isOpen, updateScrollState]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  const hasBody = children !== undefined && children !== null;
  const hasPrimary = buttons === 'primary' || buttons === 'primarySecondary';
  const hasSecondary = buttons === 'primarySecondary';
  const hasFooter = hasPrimary || hasSecondary;
  const shouldCloseOnBackdropClick = closeOnBackdropClick ?? !disablePointerDismissal;

  return (
    <BaseDialog.Root
      actionsRef={actionsRef}
      disablePointerDismissal={!shouldCloseOnBackdropClick}
      modal={modal}
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          className="fixed inset-0 z-40 min-h-dvh bg-[var(--color-bg-overlay)] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute"
          data-testid="dialog-backdrop"
        />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center py-[10dvh]">
          <BaseDialog.Popup
            className={cn(
              'relative flex max-h-[80dvh] min-h-0 w-[90%] min-w-0 flex-col overflow-hidden rounded-[20px] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] shadow-[0_8px_24px_rgba(0,0,0,0.18)] outline-none md:w-[480px]',
              className,
            )}
            data-testid="dialog"
          >
            <header
              className={cn(
                'shrink-0 border-b border-transparent px-[22px] pt-[calc(36px+env(safe-area-inset-top,0px))]',
                scrollState.isScrolled && 'border-[var(--color-stroke-neutral-subtle)]',
              )}
              data-scrolled={scrollState.isScrolled || undefined}
              data-testid="dialog-header"
            >
              <div className="flex min-w-0 items-start gap-3">
                <BaseDialog.Title className="m-0 min-w-0 flex-1 break-words">
                  <Text as="span" variant="t7Bold">
                    {title}
                  </Text>
                </BaseDialog.Title>
                {showCloseButton ? (
                  <BaseDialog.Close
                    aria-label={closeButtonLabel}
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--dimension-x2)] text-[var(--color-fg-neutral-muted)] transition-colors hover:bg-[var(--color-bg-transparent-pressed)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                    type="button"
                  >
                    <Icon name="xmark" size={20} />
                  </BaseDialog.Close>
                ) : null}
              </div>
              {description !== undefined && description !== null ? (
                <BaseDialog.Description className="m-0 mt-3 break-words">
                  <Text as="span" color="fg.neutral" variant="t5Regular">
                    {description}
                  </Text>
                </BaseDialog.Description>
              ) : null}
            </header>

            {hasBody ? (
              <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  ref={bodyRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] pt-8 pb-[56px]"
                  data-testid="dialog-body"
                  onScroll={updateScrollState}
                >
                  {children}
                </div>
                {scrollState.canScroll && !scrollState.isAtBottom ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-[56px] bg-gradient-to-t from-[var(--color-bg-layer-default)] to-transparent"
                    data-testid="dialog-scroll-fog"
                  />
                ) : null}
              </div>
            ) : null}

            {hasFooter ? (
              <footer
                className={cn(
                  'flex shrink-0 gap-3 px-[22px] pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-5',
                  hasSecondary ? 'flex-row' : 'flex-col',
                )}
                data-testid="dialog-footer"
              >
                {hasPrimary ? (
                  <DialogActionButton
                    actionProps={primaryButtonProps}
                    label={primaryLabel}
                    onClose={() => actionsRef.current?.close()}
                    variant="brand-solid"
                  />
                ) : null}
                {hasSecondary ? (
                  <DialogActionButton
                    actionProps={secondaryButtonProps}
                    label={secondaryLabel}
                    onClose={() => actionsRef.current?.close()}
                    variant="neutral-weak"
                  />
                ) : null}
              </footer>
            ) : null}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
