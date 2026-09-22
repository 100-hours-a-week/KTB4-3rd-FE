import { useRef, useState, type KeyboardEvent, type WheelEvent } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';
import { ScrollFog } from './scroll-fog';
import { Text } from './text';

export type DatePickerProps = {
  /** The selected date. Omit this prop to use the uncontrolled mode. */
  value?: Date | null;
  /** Initial selected date used when `value` is omitted. */
  defaultValue?: Date;
  /** Called when a date is selected from the calendar. */
  onValueChange?: (value: Date) => void;
  /** The earliest selectable date, inclusive. */
  minDate?: Date;
  /** The latest selectable date, inclusive. */
  maxDate?: Date;
  /** Date used to render the today state. Defaults to the current date. */
  today?: Date;
  /** Accessible name for the complete date picker. */
  'aria-label'?: string;
  /** Disables date selection and navigation. */
  disabled?: boolean;
  className?: string;
};

type CalendarDate = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const VISIBLE_PICKER_ROWS = 7;
const PICKER_CENTER_OFFSET = Math.floor(VISIBLE_PICKER_ROWS / 2);
const WHEEL_DELTA_THRESHOLD = 120;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function isSameDate(firstDate: Date | null | undefined, secondDate: Date | null | undefined) {
  return firstDate !== null &&
    firstDate !== undefined &&
    secondDate !== null &&
    secondDate !== undefined
    ? toDateKey(firstDate) === toDateKey(secondDate)
    : false;
}

function isBefore(firstDate: Date, secondDate: Date) {
  return startOfDay(firstDate).getTime() < startOfDay(secondDate).getTime();
}

function isAfter(firstDate: Date, secondDate: Date) {
  return startOfDay(firstDate).getTime() > startOfDay(secondDate).getTime();
}

function isSelectable(date: Date, minDate?: Date, maxDate?: Date) {
  return !(minDate && isBefore(date, minDate)) && !(maxDate && isAfter(date, maxDate));
}

function getCalendarDates(month: Date): CalendarDate[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cellCount = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstDayOfMonth + 1;
    const isCurrentMonth = day >= 1 && day <= daysInMonth;

    return {
      date: new Date(year, monthIndex, isCurrentMonth ? day : 1),
      day,
      isCurrentMonth,
    };
  });
}

function getVisibleOptions<T>(options: readonly T[], selectedIndex: number) {
  return Array.from({ length: VISIBLE_PICKER_ROWS }, (_, offset) => {
    const index = selectedIndex + offset - PICKER_CENTER_OFFSET;

    return {
      value: index >= 0 && index < options.length ? options[index] : null,
      isSelected: offset === PICKER_CENTER_OFFSET,
    };
  });
}

function getNextIndex(currentIndex: number, length: number, direction: -1 | 1) {
  return Math.max(0, Math.min(length - 1, currentIndex + direction));
}

type PickerColumnProps = {
  'aria-label': string;
  className?: string;
  disabled: boolean;
  name: 'year' | 'month';
  onValueChange: (value: number) => void;
  options: readonly number[];
  value: number;
};

function PickerColumn({
  'aria-label': ariaLabel,
  className,
  disabled,
  name,
  onValueChange,
  options,
  value,
}: PickerColumnProps) {
  const selectedIndex = Math.max(0, options.indexOf(value));
  const wheelDeltaRef = useRef(0);

  const commitValue = (nextValue: number) => {
    wheelDeltaRef.current = 0;
    onValueChange(nextValue);
  };

  const moveValue = (direction: -1 | 1) => {
    const nextIndex = getNextIndex(selectedIndex, options.length, direction);

    if (nextIndex !== selectedIndex) {
      commitValue(options[nextIndex]);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
      return;
    }

    event.preventDefault();
    moveValue(event.key === 'ArrowUp' ? -1 : 1);
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
    moveValue(direction);
  };

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-disabled={disabled || undefined}
      className={cn('absolute inset-y-0 z-10 w-1/2 outline-none', className)}
      data-date-picker-column={name}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      role="listbox"
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className="absolute inset-x-0 top-0 flex flex-col"
        style={{ transform: 'translateY(-52px)' }}
      >
        {getVisibleOptions(options, selectedIndex).map(({ value: option, isSelected }, index) => (
          <div
            className="flex h-[52px] w-full items-center justify-center"
            key={`${name}-${index}`}
          >
            {option === null ? null : (
              <button
                aria-selected={isSelected}
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-[12px] outline-none',
                  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
                  'active:bg-[var(--color-bg-transparent-pressed)]',
                  disabled && 'cursor-not-allowed',
                )}
                disabled={disabled}
                onClick={() => commitValue(option)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <Text
                  as="span"
                  className={cn(
                    isSelected
                      ? 'text-[var(--color-fg-neutral)]'
                      : 'text-[var(--color-fg-disabled)]',
                    isSelected && 'translate-y-px',
                  )}
                  variant={isSelected ? 't12Bold' : 't11Regular'}
                >
                  {name === 'year' ? `${option}년` : `${option}월`}
                </Text>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeDate(value: Date | null | undefined, fallback: Date) {
  return value ? startOfDay(value) : startOfDay(fallback);
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  minDate,
  maxDate,
  today = new Date(),
  'aria-label': ariaLabel = '날짜 선택',
  disabled = false,
  className,
}: DatePickerProps) {
  const normalizedToday = startOfDay(today);
  const initialDate = normalizeDate(defaultValue, normalizedToday);
  const [internalValue, setInternalValue] = useState<Date | null>(
    defaultValue ? initialDate : normalizedToday,
  );
  let currentValue: Date | null;

  if (value === undefined) {
    currentValue = internalValue;
  } else {
    currentValue = value === null ? null : startOfDay(value);
  }
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value ?? defaultValue ?? normalizedToday),
  );
  const [isYearMonthOpen, setIsYearMonthOpen] = useState(false);

  const selectedMonth = visibleMonth.getMonth() + 1;
  const selectedYear = visibleMonth.getFullYear();
  const years = Array.from(
    { length: VISIBLE_PICKER_ROWS },
    (_, index) => selectedYear - PICKER_CENTER_OFFSET + index,
  );
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const calendarDates = getCalendarDates(visibleMonth);

  const updateVisibleMonth = (year: number, month: number) => {
    setVisibleMonth(new Date(year, month - 1, 1));
  };

  const moveMonth = (direction: -1 | 1) => {
    const nextMonth = new Date(selectedYear, visibleMonth.getMonth() + direction, 1);
    setVisibleMonth(nextMonth);
  };

  const selectDate = (date: Date) => {
    if (disabled || !isSelectable(date, minDate, maxDate)) {
      return;
    }

    const nextValue = startOfDay(date);

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      className={cn(
        'relative w-[620px] max-w-full rounded-[20px] bg-[var(--color-bg-layer-basement)] p-[24px]',
        disabled && 'cursor-not-allowed opacity-60',
        className,
      )}
      data-date-picker-mode={isYearMonthOpen ? 'year-month' : 'month'}
      role="group"
    >
      <div className="min-h-[388px] rounded-[20px] bg-[var(--color-bg-layer-default)] px-[24px] pt-[16px] pb-[16px]">
        <div className="flex h-[48px] items-center justify-between">
          <button
            aria-controls="date-picker-content"
            aria-expanded={isYearMonthOpen}
            className="group flex h-[48px] items-center gap-[8px] rounded-[8px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
            disabled={disabled}
            onClick={() => setIsYearMonthOpen((open) => !open)}
            type="button"
          >
            <Text as="span" color="fg.neutral" variant="t10Bold">
              {selectedYear}년 {selectedMonth}월
            </Text>
            <Icon
              aria-hidden="true"
              className="text-[var(--color-fg-neutral)]"
              name={isYearMonthOpen ? 'chevronUp' : 'chevronDown'}
              size={24}
            />
          </button>

          <div className="flex items-center gap-[16px]">
            <button
              aria-label="이전 달"
              className="inline-flex size-[24px] items-center justify-center rounded-full text-[var(--color-fg-neutral-muted)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
              disabled={disabled}
              onClick={() => moveMonth(-1)}
              type="button"
            >
              <Icon aria-hidden="true" name="chevronLeft" size={24} />
            </button>
            <button
              aria-label="다음 달"
              className="inline-flex size-[24px] items-center justify-center rounded-full text-[var(--color-fg-neutral)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
              disabled={disabled}
              onClick={() => moveMonth(1)}
              type="button"
            >
              <Icon aria-hidden="true" name="chevronRight" size={24} />
            </button>
          </div>
        </div>

        <div id="date-picker-content" className="mt-[20px]">
          {isYearMonthOpen ? (
            <div className="relative h-[260px] overflow-hidden" data-date-picker-panel="year-month">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[104px] z-10 h-[52px] rounded-[12px] bg-[var(--color-bg-neutral-weak)]"
              />
              <PickerColumn
                aria-label="연도"
                disabled={disabled}
                name="year"
                onValueChange={(year) => updateVisibleMonth(year, selectedMonth)}
                options={years}
                value={selectedYear}
              />
              <PickerColumn
                aria-label="월"
                className="left-1/2"
                disabled={disabled}
                name="month"
                onValueChange={(month) => updateVisibleMonth(selectedYear, month)}
                options={months}
                value={selectedMonth}
              />
              <ScrollFog />
            </div>
          ) : (
            <>
              <div
                aria-hidden="true"
                className="grid h-[28px] grid-cols-7 text-center text-[var(--color-fg-neutral-subtle)]"
              >
                {WEEKDAYS.map((weekday) => (
                  <Text as="span" fontWeight="medium" key={weekday} variant="t5Regular">
                    {weekday}
                  </Text>
                ))}
              </div>
              <div
                aria-label={`${selectedYear}년 ${selectedMonth}월`}
                className="grid grid-cols-7"
                role="grid"
              >
                {calendarDates.map(({ date, day, isCurrentMonth }, index) => {
                  if (!isCurrentMonth) {
                    return <div aria-hidden="true" className="h-[52px]" key={`empty-${index}`} />;
                  }

                  const isDisabled = disabled || !isSelectable(date, minDate, maxDate);
                  const isSelected = isSameDate(currentValue, date);
                  const isToday = isSameDate(normalizedToday, date);

                  return (
                    <div
                      aria-selected={isSelected}
                      className="flex h-[52px] items-center justify-center"
                      key={toDateKey(date)}
                      role="gridcell"
                    >
                      <button
                        aria-current={isToday ? 'date' : undefined}
                        aria-label={`${selectedYear}년 ${selectedMonth}월 ${day}일`}
                        aria-selected={isSelected}
                        className={cn(
                          'relative inline-flex size-[48px] items-center justify-center rounded-full text-[var(--color-fg-neutral)] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
                          'active:bg-[var(--color-bg-transparent-pressed)]',
                          isToday && !isSelected && 'bg-[var(--color-bg-brand-weak)]',
                          isSelected &&
                            'bg-[var(--color-bg-brand-solid)] text-[var(--color-fg-neutral-inverted)]',
                          isDisabled && 'cursor-not-allowed text-[var(--color-fg-disabled)]',
                        )}
                        disabled={isDisabled}
                        onClick={() => selectDate(date)}
                        type="button"
                      >
                        <Text
                          as="span"
                          className="relative z-10"
                          variant="t6Regular"
                          color={isSelected ? 'fg.neutralInverted' : undefined}
                        >
                          {day}
                        </Text>
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
