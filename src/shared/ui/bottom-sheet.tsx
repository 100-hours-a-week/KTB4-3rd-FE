'use client';

import { Drawer } from '@base-ui/react/drawer';
import { useState, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Button } from './button';
import { Divider } from './divider';
import { Text } from './text';

export type BottomSheetSnapPoint = number | string;
export type BottomSheetModal = boolean | 'trap-focus';

export type BottomSheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  snapPoints?: BottomSheetSnapPoint[];
  defaultSnapPoint?: BottomSheetSnapPoint | null;
  snapPoint?: BottomSheetSnapPoint | null;
  onSnapPointChange?: (snapPoint: BottomSheetSnapPoint | null) => void;

  modal?: BottomSheetModal;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  bottomOffset?: number | string;
  showBackdrop?: boolean;
  showViewAllButton?: boolean;
  onViewAll?: () => void;
  className?: string;
};

const popupClassName = cn(
  'relative z-10 flex max-h-[100dvh] min-h-[70dvh] w-full flex-col overflow-visible rounded-tl-[24px] rounded-tr-[24px] bg-[var(--color-bg-layer-default)] text-[var(--color-fg-neutral)] outline-none shadow-[0_-4px_16px_rgba(0,0,0,0.12)]',
  'touch-none [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] transition-[transform,box-shadow] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
  'data-swiping:select-none data-starting-style:[transform:translateY(calc(100%+2px))] data-ending-style:[transform:translateY(calc(100%+2px))]',
  'data-starting-style:shadow-[0_-4px_16px_rgba(0,0,0,0)] data-ending-style:shadow-[0_-4px_16px_rgba(0,0,0,0)]',
  'data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
);

const backdropClassName = cn(
  'fixed inset-0 z-40 min-h-dvh bg-[var(--color-bg-overlay)] opacity-[calc(1-var(--drawer-swipe-progress))]',
  'transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0',
  'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
);

const defaultSnapPoints: BottomSheetSnapPoint[] = ['112px', 0.5, 0.7];

function isDismissiveSnapPoint(snapPoint: BottomSheetSnapPoint) {
  if (typeof snapPoint === 'number') {
    return snapPoint <= 0;
  }

  return /^0(?:\.0+)?(?:px|rem)?$/i.test(snapPoint.trim());
}

function resolveNonDismissiveSnapPoint(
  snapPoint: BottomSheetSnapPoint | null | undefined,
  fallback: BottomSheetSnapPoint,
) {
  if (snapPoint === undefined) {
    return undefined;
  }

  if (snapPoint === null || isDismissiveSnapPoint(snapPoint)) {
    return fallback;
  }

  return snapPoint;
}

/**
 * Mobile-first bottom panel built on Base UI Drawer.
 *
 * The component owns only drawer presentation and interaction. Data fetching and
 * content behavior remain with the caller through `children`.
 */
export function BottomSheet({
  open,
  defaultOpen,
  onOpenChange,
  snapPoints,
  defaultSnapPoint,
  snapPoint,
  onSnapPointChange,
  modal = true,
  title,
  description,
  children,
  bottomOffset,
  showBackdrop = true,
  showViewAllButton = false,
  onViewAll,
  className,
}: BottomSheetProps) {
  const hasTitle = title !== undefined && title !== null;
  const hasDescription = description !== undefined && description !== null;
  const hasViewAllButton = showViewAllButton && onViewAll !== undefined;
  const resolvedSnapPoints = (snapPoints ?? defaultSnapPoints).filter(
    (point) => !isDismissiveSnapPoint(point),
  );
  const safeSnapPoints = resolvedSnapPoints.length > 0 ? resolvedSnapPoints : defaultSnapPoints;
  const minimumSnapPoint = safeSnapPoints[0];
  const resolvedDefaultSnapPoint =
    resolveNonDismissiveSnapPoint(defaultSnapPoint, minimumSnapPoint) ?? minimumSnapPoint;
  const resolvedSnapPoint = resolveNonDismissiveSnapPoint(snapPoint, minimumSnapPoint);
  const isSnapPointControlled = snapPoint !== undefined;
  const [internalSnapPoint, setInternalSnapPoint] =
    useState<BottomSheetSnapPoint>(resolvedDefaultSnapPoint);
  const activeSnapPoint = isSnapPointControlled ? resolvedSnapPoint : internalSnapPoint;

  const handleOpenChange = (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
    if (!nextOpen) {
      eventDetails.cancel();
      return;
    }

    onOpenChange?.(true);
  };

  const handleSnapPointChange = (
    nextSnapPoint: BottomSheetSnapPoint | null,
    eventDetails: Drawer.Root.SnapPointChangeEventDetails,
  ) => {
    if (nextSnapPoint === null || isDismissiveSnapPoint(nextSnapPoint)) {
      eventDetails.cancel();
      return;
    }

    if (!isSnapPointControlled) {
      setInternalSnapPoint(nextSnapPoint);
    }
    onSnapPointChange?.(nextSnapPoint);
  };

  const handleBackdropClick = () => {
    if (!isSnapPointControlled) {
      setInternalSnapPoint(minimumSnapPoint);
    }
    onSnapPointChange?.(minimumSnapPoint);
  };

  return (
    <Drawer.Root
      disablePointerDismissal
      defaultOpen={defaultOpen}
      defaultSnapPoint={resolvedDefaultSnapPoint}
      modal={modal}
      onOpenChange={handleOpenChange}
      onSnapPointChange={handleSnapPointChange}
      open={open}
      snapPoint={activeSnapPoint}
      snapPoints={safeSnapPoints}
      snapToSequentialPoints
    >
      <Drawer.Portal>
        <Drawer.Backdrop
          className={showBackdrop ? backdropClassName : 'hidden'}
          data-testid="bottom-sheet-backdrop"
        />
        <Drawer.Viewport
          className={cn(
            'fixed inset-x-0 top-0 z-50 flex touch-none items-end justify-center overflow-hidden',
            modal !== true && 'pointer-events-none',
          )}
          data-testid="bottom-sheet-viewport"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              handleBackdropClick();
            }
          }}
          style={bottomOffset === undefined ? undefined : { bottom: bottomOffset }}
        >
          <Drawer.Popup
            aria-label={hasTitle ? undefined : '바텀시트'}
            className={cn(popupClassName, modal !== true && 'pointer-events-auto', className)}
          >
            <div className="shrink-0 touch-none px-[var(--dimension-x5)] pt-3 select-none">
              <div
                aria-hidden="true"
                className="mx-auto h-[5px] w-[41px] rounded-[3px] bg-[var(--color-fg-neutral-subtle)]"
              />
              {hasTitle || hasViewAllButton ? (
                <div className="mt-[31px] flex items-start justify-between gap-[var(--dimension-x3)]">
                  {hasTitle ? (
                    <Drawer.Title className="m-0 min-w-0 flex-1 break-words">
                      <Text as="span" color="fg.neutral" variant="t8Bold">
                        {title}
                      </Text>
                    </Drawer.Title>
                  ) : null}
                  {hasViewAllButton ? (
                    <Button
                      className="h-[30px] min-h-0 shrink-0 px-0 py-0 text-[var(--color-fg-brand)]"
                      onClick={onViewAll}
                      size="xsmall"
                      type="button"
                      variant="ghost"
                    >
                      전체보기
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {hasDescription ? (
                <Drawer.Description
                  className={cn(
                    hasTitle || hasViewAllButton ? 'mt-0.5' : 'mt-[31px]',
                    'm-0 break-words',
                  )}
                  data-testid="bottom-sheet-description"
                >
                  <Text as="span" color="fg.neutralMuted" variant="t3Regular">
                    {description}
                  </Text>
                </Drawer.Description>
              ) : null}
              <Divider className="mt-3" color="neutral-subtle" data-testid="bottom-sheet-divider" />
            </div>
            <Drawer.Content
              className="min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain pb-[calc(var(--dimension-x5)+env(safe-area-inset-bottom,0px))]"
              data-testid="bottom-sheet-content"
            >
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
