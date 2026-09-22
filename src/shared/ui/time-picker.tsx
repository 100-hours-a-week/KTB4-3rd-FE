import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type TransitionEvent,
  type WheelEvent,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

export type TimePeriod = '오전' | '오후';
export type TimeMinute = 0 | 10 | 20 | 30 | 40 | 50;
export type TimeHour = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type TimePickerValue = {
  period: TimePeriod;
  hour: TimeHour;
  minute: TimeMinute;
};

export type TimePickerProps = {
  /** The selected time. Omit this prop to use the uncontrolled mode. */
  value?: TimePickerValue;
  /** Initial time used when `value` is omitted. */
  defaultValue?: TimePickerValue;
  /** Called whenever one of the three columns changes. */
  onValueChange?: (value: TimePickerValue) => void;
  /** Accessible name for the complete time picker. */
  'aria-label'?: string;
  /** Disables all time selection controls. */
  disabled?: boolean;
  className?: string;
};

const TIME_PERIODS = ['오전', '오후'] as const satisfies readonly TimePeriod[];
const TIME_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly TimeHour[];
const TIME_MINUTES = [0, 10, 20, 30, 40, 50] as const satisfies readonly TimeMinute[];

const DEFAULT_TIME: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

const TIME_PICKER_ROW_HEIGHT = 42;
const TIME_PICKER_SELECTED_ROW_OFFSET = 6;
const WHEEL_DELTA_THRESHOLD = 120;
const DRAG_ROW_COUNT = 2;
const VISIBLE_ROW_OFFSETS = [-2, -1, 0, 1, 2] as const;
const UNSELECTED_TEXT_COLOR = [152, 162, 179] as const;
const SELECTED_TEXT_COLOR = [29, 41, 57] as const;

function isTimePeriod(value: string | undefined): value is TimePeriod {
  return value === '오전' || value === '오후';
}

function isTimeHour(value: number | undefined): value is TimeHour {
  return value !== undefined && TIME_HOURS.includes(value as TimeHour);
}

function isTimeMinute(value: number | undefined): value is TimeMinute {
  return value !== undefined && TIME_MINUTES.includes(value as TimeMinute);
}

function normalizeTimeValue(value?: TimePickerValue): TimePickerValue {
  return {
    period: isTimePeriod(value?.period) ? value.period : DEFAULT_TIME.period,
    hour: isTimeHour(value?.hour) ? value.hour : DEFAULT_TIME.hour,
    minute: isTimeMinute(value?.minute) ? value.minute : DEFAULT_TIME.minute,
  };
}

function formatMinute(minute: TimeMinute) {
  return minute.toString().padStart(2, '0');
}

function getAdjacentValue(
  options: readonly string[],
  value: string,
  direction: -1 | 1,
  cyclic: boolean,
) {
  const currentIndex = Math.max(0, options.indexOf(value));
  const nextIndex = currentIndex + direction;

  if (cyclic) {
    return options[(nextIndex + options.length) % options.length];
  }

  return options[Math.max(0, Math.min(options.length - 1, nextIndex))];
}

function getValueAfterSteps(
  options: readonly string[],
  value: string,
  steps: number,
  cyclic: boolean,
) {
  let nextValue = value;
  const direction = steps > 0 ? 1 : -1;

  for (let step = 0; step < Math.abs(steps); step += 1) {
    nextValue = getAdjacentValue(options, nextValue, direction, cyclic);
  }

  return nextValue;
}

function getSelectionProgress(offset: number, dragOffset: number) {
  const distanceFromSelection = Math.abs(offset * TIME_PICKER_ROW_HEIGHT + dragOffset);

  return Math.max(0, Math.min(1, 1 - distanceFromSelection / TIME_PICKER_ROW_HEIGHT));
}

function getInterpolatedTextColor(progress: number) {
  const channels = SELECTED_TEXT_COLOR.map((selectedChannel, index) => {
    const unselectedChannel = UNSELECTED_TEXT_COLOR[index];
    return Math.round(unselectedChannel + (selectedChannel - unselectedChannel) * progress);
  });

  return `rgb(${channels.join(', ')})`;
}

type TimePickerColumnProps = {
  'aria-label': string;
  className: string;
  cyclic?: boolean;
  disabled: boolean;
  name: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  value: string;
};

function TimePickerColumn({
  'aria-label': ariaLabel,
  className,
  cyclic = false,
  disabled,
  name,
  onValueChange,
  options,
  value,
}: TimePickerColumnProps) {
  const wheelDeltaRef = useRef(0);
  const dragStateRef = useRef<{ pointerId: number; startY: number } | null>(null);
  const pendingSnapRef = useRef<{ value: string } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRebasing, setIsRebasing] = useState(false);
  const [rebaseFromValue, setRebaseFromValue] = useState<string | null>(null);
  const [rebaseValue, setRebaseValue] = useState<string | null>(null);

  const maxDragOffset = TIME_PICKER_ROW_HEIGHT * DRAG_ROW_COUNT;
  const displayedValue =
    isRebasing && rebaseFromValue === value && rebaseValue !== null ? rebaseValue : value;
  const selectedIndex = Math.max(0, options.indexOf(displayedValue));

  const commitValue = (nextValue: string) => {
    wheelDeltaRef.current = 0;
    onValueChange(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    commitValue(getAdjacentValue(options, value, event.key === 'ArrowUp' ? -1 : 1, cyclic));
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (disabled || event.deltaY === 0) {
      return;
    }

    event.preventDefault();

    if (
      wheelDeltaRef.current !== 0 &&
      Math.sign(wheelDeltaRef.current) !== Math.sign(event.deltaY)
    ) {
      wheelDeltaRef.current = 0;
    }

    wheelDeltaRef.current += event.deltaY;

    if (Math.abs(wheelDeltaRef.current) < WHEEL_DELTA_THRESHOLD) {
      return;
    }

    const direction = wheelDeltaRef.current > 0 ? 1 : -1;
    wheelDeltaRef.current = 0;
    commitValue(getAdjacentValue(options, value, direction, cyclic));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    pendingSnapRef.current = null;
    setIsRebasing(false);
    setRebaseFromValue(null);
    setRebaseValue(null);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStateRef.current = { pointerId: event.pointerId, startY: event.clientY };
    wheelDeltaRef.current = 0;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const nextOffset = Math.max(
      -maxDragOffset,
      Math.min(maxDragOffset, event.clientY - dragState.startY),
    );
    setDragOffset(nextOffset);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const steps =
      dragOffset === 0
        ? 0
        : Math.sign(-dragOffset) * Math.round(Math.abs(dragOffset) / TIME_PICKER_ROW_HEIGHT);
    const snapOffset = -steps * TIME_PICKER_ROW_HEIGHT;

    dragStateRef.current = null;
    setIsDragging(false);

    if (steps === 0) {
      setDragOffset(0);
      return;
    }

    const nextValue = getValueAfterSteps(options, value, steps, cyclic);
    pendingSnapRef.current = { value: nextValue };

    if (dragOffset === snapOffset) {
      pendingSnapRef.current = null;
      setRebaseFromValue(value);
      setRebaseValue(nextValue);
      setIsRebasing(true);
      commitValue(nextValue);
      setDragOffset(0);
      return;
    }

    setDragOffset(snapOffset);
  };

  const cancelDrag = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    pendingSnapRef.current = null;
    setIsRebasing(false);
    setRebaseFromValue(null);
    setRebaseValue(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleSnapTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
      return;
    }

    const pendingSnap = pendingSnapRef.current;

    if (!pendingSnap) {
      return;
    }

    pendingSnapRef.current = null;
    setRebaseFromValue(value);
    setRebaseValue(pendingSnap.value);
    setIsRebasing(true);
    commitValue(pendingSnap.value);
    setDragOffset(0);
  };

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-disabled={disabled || undefined}
      className={cn('absolute top-0 h-[224px] touch-none outline-none', className)}
      data-time-picker-column={name}
      onKeyDown={handleKeyDown}
      onPointerCancel={cancelDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onWheel={handleWheel}
      role="listbox"
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 flex flex-col transition-transform duration-200 ease-out',
          (isDragging || isRebasing) && 'transition-none',
        )}
        onTransitionEnd={handleSnapTransitionEnd}
        style={{ transform: `translateY(${TIME_PICKER_SELECTED_ROW_OFFSET + dragOffset}px)` }}
      >
        {VISIBLE_ROW_OFFSETS.map((offset) => {
          const itemIndex = selectedIndex + offset;
          const isWithinBounds = cyclic || (itemIndex >= 0 && itemIndex < options.length);
          const option = isWithinBounds
            ? options[cyclic ? (itemIndex + options.length) % options.length : itemIndex]
            : null;
          const isSelected = offset === 0;
          const selectionProgress = getSelectionProgress(offset, dragOffset);

          return (
            <div
              className="flex h-[42px] w-full items-center justify-center"
              key={`${name}-${offset}`}
            >
              {option === null ? null : (
                <button
                  aria-selected={isSelected}
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded-[12px] outline-none transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
                    'active:bg-[var(--color-bg-transparent-pressed)]',
                    disabled && 'cursor-not-allowed',
                  )}
                  data-selection-progress={selectionProgress.toFixed(2)}
                  disabled={disabled}
                  onClick={() => commitValue(option)}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  <Text
                    as="span"
                    className="transition-[color,font-size,line-height,font-weight,transform] duration-100 ease-out"
                    style={{
                      color: getInterpolatedTextColor(selectionProgress),
                      fontSize: `${22 + selectionProgress * 2}px`,
                      fontWeight: 400 + selectionProgress * 300,
                      lineHeight: `${30 + selectionProgress * 2}px`,
                      transform: `translateY(${selectionProgress}px)`,
                    }}
                    variant="t8Regular"
                  >
                    {option}
                  </Text>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScrollFog() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[84px] bg-[linear-gradient(180deg,rgb(255,255,255)_0%,rgba(255,255,255,0.988)_8%,rgba(255,255,255,0.98)_16%,rgba(255,255,255,0.949)_22%,rgba(255,255,255,0.922)_29%,rgba(255,255,255,0.871)_35%,rgba(255,255,255,0.82)_41%,rgba(255,255,255,0.749)_47%,rgba(255,255,255,0.678)_53%,rgba(255,255,255,0.6)_59%,rgba(255,255,255,0.522)_65%,rgba(255,255,255,0.42)_71%,rgba(255,255,255,0.329)_78%,rgba(255,255,255,0.22)_84%,rgba(255,255,255,0.11)_92%,rgba(255,255,255,0)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[140px] z-20 h-[84px] bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.012)_8%,rgba(255,255,255,0.02)_16%,rgba(255,255,255,0.051)_22%,rgba(255,255,255,0.078)_29%,rgba(255,255,255,0.129)_35%,rgba(255,255,255,0.18)_41%,rgba(255,255,255,0.251)_47%,rgba(255,255,255,0.322)_53%,rgba(255,255,255,0.4)_59%,rgba(255,255,255,0.478)_65%,rgba(255,255,255,0.58)_71%,rgba(255,255,255,0.671)_78%,rgba(255,255,255,0.78)_84%,rgba(255,255,255,0.89)_92%,rgb(255,255,255)_100%)]"
      />
    </>
  );
}

export function TimePicker({
  value,
  defaultValue,
  onValueChange,
  'aria-label': ariaLabel = '시간 선택',
  disabled = false,
  className,
}: TimePickerProps) {
  const [internalValue, setInternalValue] = useState(() => normalizeTimeValue(defaultValue));
  const currentValue = value === undefined ? internalValue : normalizeTimeValue(value);
  const periodOptions = TIME_PERIODS;
  const hourOptions = TIME_HOURS.map(String);
  const minuteOptions = TIME_MINUTES.map(formatMinute);

  const updateValue = (nextValue: TimePickerValue) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        'relative h-[224px] w-[353px] overflow-hidden rounded-[16px] bg-[var(--color-bg-layer-default)]',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
      data-node-id="1002:7047"
      role="group"
    >
      <div
        aria-hidden="true"
        className="absolute top-[90px] left-[12px] z-0 h-[44px] w-[329px] rounded-[12px] bg-[#eaecf0]"
      />

      <TimePickerColumn
        aria-label="오전 또는 오후"
        className="left-[41px] w-[102px]"
        disabled={disabled}
        name="period"
        onValueChange={(nextPeriod) =>
          updateValue({ ...currentValue, period: nextPeriod as TimePeriod })
        }
        options={periodOptions}
        value={currentValue.period}
      />
      <TimePickerColumn
        aria-label="시"
        className="left-[135px] w-[82px]"
        cyclic
        disabled={disabled}
        name="hour"
        onValueChange={(nextHour) =>
          updateValue({ ...currentValue, hour: Number(nextHour) as TimeHour })
        }
        options={hourOptions}
        value={String(currentValue.hour)}
      />
      <TimePickerColumn
        aria-label="분"
        className="left-[199px] w-[98px]"
        cyclic
        disabled={disabled}
        name="minute"
        onValueChange={(nextMinute) =>
          updateValue({ ...currentValue, minute: Number(nextMinute) as TimeMinute })
        }
        options={minuteOptions}
        value={formatMinute(currentValue.minute)}
      />

      <ScrollFog />
    </div>
  );
}
