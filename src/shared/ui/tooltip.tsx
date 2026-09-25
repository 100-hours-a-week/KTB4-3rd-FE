'use client';

import Image from 'next/image';
import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';

export type TooltipProps = {
  children: ReactElement<{ 'aria-describedby'?: string }>;
  message: ReactNode;
  position?: TooltipPosition;
  align?: TooltipAlign;
  initialDisplayDuration?: number;
  releaseDisplayDuration?: number;
  longPressDelay?: number;
  fadeDuration?: number;
  className?: string;
  contentClassName?: string;
};

const DEFAULT_FADE_DURATION = 250;
const DEFAULT_INITIAL_DISPLAY_DURATION = 3000;
const DEFAULT_LONG_PRESS_DELAY = 500;
const DEFAULT_RELEASE_DISPLAY_DURATION = 3000;

const tooltipPositionClassNames: Record<TooltipPosition, Record<TooltipAlign, string>> = {
  top: {
    start: 'bottom-full left-0',
    center: 'bottom-full left-1/2 -translate-x-1/2',
    end: 'right-0 bottom-full',
  },
  right: {
    start: 'top-0 left-full',
    center: 'top-1/2 left-full -translate-y-1/2',
    end: 'bottom-0 left-full',
  },
  bottom: {
    start: 'top-full left-0',
    center: 'top-full left-1/2 -translate-x-1/2',
    end: 'top-full right-0',
  },
  left: {
    start: 'top-0 right-full',
    center: 'top-1/2 right-full -translate-y-1/2',
    end: 'right-full bottom-0',
  },
};

const tooltipArrowClassNames: Record<TooltipPosition, Record<TooltipAlign, string>> = {
  top: {
    start: 'top-[23px] left-[9px] -scale-y-100',
    center: 'top-[23px] left-1/2 -translate-x-1/2 -scale-y-100',
    end: 'top-[23px] right-[8px] -scale-y-100',
  },
  right: {
    start: 'top-[9px] left-[-8px] -rotate-90',
    center: 'top-1/2 left-[-8px] -translate-y-1/2 -rotate-90',
    end: 'bottom-[9px] left-[-8px] -rotate-90',
  },
  bottom: {
    start: 'bottom-[23px] left-[9px]',
    center: 'bottom-[23px] left-1/2 -translate-x-1/2',
    end: 'right-[8px] bottom-[23px]',
  },
  left: {
    start: 'top-[9px] right-[-8px] rotate-90',
    center: 'top-1/2 right-[-8px] -translate-y-1/2 rotate-90',
    end: 'right-[-8px] bottom-[9px] rotate-90',
  },
};

function clearTimer(timerRef: { current: number | null }) {
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

function getDescribedByValue(
  existingValue: string | undefined,
  tooltipId: string,
  includeTooltip: boolean,
) {
  return (
    [existingValue, includeTooltip ? tooltipId : undefined].filter(Boolean).join(' ') || undefined
  );
}

/**
 * Displays a short message above, below, left, or right of a pressable trigger.
 * The message is shown briefly on mount and can be shown again with a long press.
 */
export function Tooltip({
  children,
  message,
  position = 'top',
  align = 'center',
  initialDisplayDuration = DEFAULT_INITIAL_DISPLAY_DURATION,
  releaseDisplayDuration = DEFAULT_RELEASE_DISPLAY_DURATION,
  longPressDelay = DEFAULT_LONG_PRESS_DELAY,
  fadeDuration = DEFAULT_FADE_DURATION,
  className,
  contentClassName,
}: TooltipProps) {
  const tooltipId = `tooltip-${useId().replaceAll(':', '')}`;
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const initialTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const longPressActiveRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const pressStartedRef = useRef(false);

  const hideTooltip = useCallback(() => {
    clearTimer(initialTimerRef);
    clearTimer(fadeTimerRef);
    clearTimer(releaseTimerRef);
    setIsExiting(true);
    fadeTimerRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      fadeTimerRef.current = null;
    }, fadeDuration);
  }, [fadeDuration]);

  const showTooltip = useCallback(() => {
    clearTimer(initialTimerRef);
    clearTimer(fadeTimerRef);
    clearTimer(releaseTimerRef);
    setIsVisible(true);
    setIsExiting(false);
  }, []);

  const scheduleHideTooltip = useCallback(
    (delay: number) => {
      clearTimer(releaseTimerRef);
      releaseTimerRef.current = window.setTimeout(hideTooltip, Math.max(0, delay));
    },
    [hideTooltip],
  );

  useEffect(() => {
    initialTimerRef.current = window.setTimeout(hideTooltip, Math.max(0, initialDisplayDuration));

    return () => {
      clearTimer(initialTimerRef);
      clearTimer(fadeTimerRef);
      clearTimer(pressTimerRef);
      clearTimer(releaseTimerRef);
    };
  }, [hideTooltip, initialDisplayDuration]);

  const finishPress = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!pressStartedRef.current) {
      return;
    }

    pressStartedRef.current = false;
    clearTimer(pressTimerRef);
    pointerActiveRef.current = false;

    if (typeof event.currentTarget.releasePointerCapture === 'function') {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const wasLongPress = longPressActiveRef.current;
    longPressActiveRef.current = false;

    if (wasLongPress) {
      scheduleHideTooltip(releaseDisplayDuration);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) {
      return;
    }

    clearTimer(pressTimerRef);
    clearTimer(releaseTimerRef);
    longPressActiveRef.current = false;
    pointerActiveRef.current = true;
    pressStartedRef.current = true;

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    pressTimerRef.current = window.setTimeout(
      () => {
        longPressActiveRef.current = true;
        showTooltip();
      },
      Math.max(0, longPressDelay),
    );
  };

  const existingDescribedBy = children.props['aria-describedby'];
  const describedBy = getDescribedByValue(existingDescribedBy, tooltipId, isVisible);
  const trigger = cloneElement(children, { 'aria-describedby': describedBy });

  return (
    <span
      className={cn('relative inline-flex', className)}
      onBlur={() => {
        if (!longPressActiveRef.current && releaseTimerRef.current === null) {
          hideTooltip();
        }
      }}
      onFocus={() => {
        if (!pointerActiveRef.current) {
          showTooltip();
        }
      }}
      onPointerCancel={finishPress}
      onPointerDown={handlePointerDown}
      onPointerUp={finishPress}
    >
      {trigger}
      {isVisible ? (
        <span
          aria-hidden={isExiting || undefined}
          className={cn(
            'pointer-events-none absolute z-10 flex w-max max-w-[calc(100vw-32px)] transition-opacity ease-out',
            isExiting ? 'opacity-0' : 'opacity-100',
            tooltipPositionClassNames[position][align],
            contentClassName,
          )}
          data-position={position}
          data-state={isExiting ? 'closing' : 'open'}
          id={tooltipId}
          role="tooltip"
          style={{ transitionDuration: `${fadeDuration}ms` }}
        >
          <span className="relative inline-flex min-h-[28px] items-center rounded-[8px] border border-[var(--color-stroke-neutral-subtle)] bg-[#414650] px-[7px] py-[5px]">
            <Text as="span" color="fg.neutralInverted" variant="t1Bold" whiteSpace="nowrap">
              {message}
            </Text>
          </span>
          <Image
            alt=""
            aria-hidden="true"
            className={cn(
              'absolute block h-[12px] w-[13px] max-w-none',
              tooltipArrowClassNames[position][align],
            )}
            height={12}
            src="/icons/tooltip-arrow.svg"
            width={13}
          />
        </span>
      ) : null}
    </span>
  );
}
