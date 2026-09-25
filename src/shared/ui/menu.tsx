'use client';

import { Menu as BaseMenu, type MenuPositionerProps } from '@base-ui/react/menu';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

export type MenuSide = NonNullable<MenuPositionerProps['side']>;
export type MenuAlign = NonNullable<MenuPositionerProps['align']>;

export type MenuItem = {
  id: string;
  icon: ReactNode;
  content: ReactNode;
  label?: string;
  disabled?: boolean;
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
};

export type MenuProps = {
  /** The element that opens the menu. Use `triggerNativeButton={false}` for a non-button element. */
  children: ReactElement;
  items: MenuItem[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  longPressDelay?: number;
  triggerNativeButton?: boolean;
  disabled?: boolean;
  modal?: boolean;
  side?: MenuSide;
  align?: MenuAlign;
  sideOffset?: number;
  'aria-label'?: string;
  className?: string;
  positionerClassName?: string;
  itemClassName?: string;
};

const DEFAULT_LONG_PRESS_DELAY = 500;

function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

type BaseUITriggerMouseEvent = ReactMouseEvent<HTMLElement> & {
  preventBaseUIHandler?: () => void;
};

function preventBaseUITriggerHandler(event: ReactMouseEvent<HTMLElement>) {
  (event as BaseUITriggerMouseEvent).preventBaseUIHandler?.();
}

/**
 * A compact action menu that opens from a click or a long press on its trigger.
 *
 * Items are intentionally data-driven so each usage can choose its own number,
 * icon, content, and click behavior.
 */
export function Menu({
  children,
  items,
  open,
  defaultOpen = false,
  onOpenChange,
  longPressDelay = DEFAULT_LONG_PRESS_DELAY,
  triggerNativeButton = true,
  disabled = false,
  modal = true,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  'aria-label': ariaLabel,
  className,
  positionerClassName,
  itemClassName,
}: MenuProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartedRef = useRef(false);
  const longPressTriggeredRef = useRef(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const toggleFromTrigger = useCallback(() => {
    if (!disabled) {
      handleOpenChange(!isOpen);
    }
  }, [disabled, handleOpenChange, isOpen]);

  const finishPointerPress = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pointerStartedRef.current) {
      return;
    }

    pointerStartedRef.current = false;
    clearTimer(longPressTimerRef);

    if (typeof event.currentTarget.releasePointerCapture === 'function') {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    return () => clearTimer(longPressTimerRef);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    clearTimer(longPressTimerRef);
    pointerStartedRef.current = true;
    longPressTriggeredRef.current = false;

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    longPressTimerRef.current = window.setTimeout(
      () => {
        longPressTriggeredRef.current = true;
        handleOpenChange(true);
      },
      Math.max(0, longPressDelay),
    );
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLElement>) => {
    longPressTriggeredRef.current = false;
    finishPointerPress(event);
  };

  const handleTriggerMouseDown = (event: ReactMouseEvent<HTMLElement>) => {
    // Base UI's default trigger opens on mousedown. Delaying that behavior lets
    // the same trigger support a real click and a distinct long-press gesture.
    preventBaseUITriggerHandler(event);
  };

  const handleTriggerClick = (event: ReactMouseEvent<HTMLElement>) => {
    preventBaseUITriggerHandler(event);

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    toggleFromTrigger();
  };

  return (
    <BaseMenu.Root disabled={disabled} modal={modal} onOpenChange={handleOpenChange} open={isOpen}>
      <BaseMenu.Trigger
        aria-haspopup="menu"
        nativeButton={triggerNativeButton}
        onClick={handleTriggerClick}
        onContextMenu={(event) => {
          if (longPressTriggeredRef.current) {
            event.preventDefault();
          }
        }}
        onMouseDown={handleTriggerMouseDown}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerUp={finishPointerPress}
        render={children}
      />

      <BaseMenu.Portal>
        <BaseMenu.Positioner
          align={align}
          className={cn('z-50 outline-none', positionerClassName)}
          side={side}
          sideOffset={sideOffset}
        >
          <BaseMenu.Popup
            aria-label={ariaLabel}
            className={cn(
              'w-[186px] overflow-hidden rounded-[16px] border border-[var(--color-stroke-neutral-subtle)] bg-[var(--color-bg-layer-default)] pt-[21px] pb-[20px] shadow-[0px_2px_5px_rgba(0,0,0,0.15)] outline-none',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
              'origin-top transition-[scale,opacity] duration-150 ease-out',
              className,
            )}
          >
            <div className="flex flex-col gap-[15px] px-[15px]">
              {items.map((item) => (
                <BaseMenu.Item
                  className={cn(
                    'group flex min-h-[28px] w-full cursor-pointer items-center gap-[20px] rounded-[4px] p-0 text-left outline-none',
                    'data-[highlighted]:bg-[var(--color-bg-transparent-pressed)]',
                    'data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
                    itemClassName,
                  )}
                  disabled={item.disabled}
                  id={item.id}
                  key={item.id}
                  label={item.label}
                  onClick={(event) => item.onClick?.(event)}
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex size-[24px] shrink-0 items-center justify-center text-[var(--color-fg-neutral)]"
                  >
                    {item.icon}
                  </span>
                  <Text
                    as="span"
                    className="min-w-0 flex-1 break-words"
                    color="fg.neutral"
                    style={{ fontSize: '15px', lineHeight: 'normal' }}
                    variant="t4Regular"
                  >
                    {item.content}
                  </Text>
                </BaseMenu.Item>
              ))}
            </div>
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
