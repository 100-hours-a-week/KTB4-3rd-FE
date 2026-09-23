'use client';

import {
  CalendarDate,
  createCalendar,
  fromDateToLocal,
  getLocalTimeZone,
} from '@internationalized/date';
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from '@ncdai/react-wheel-picker';
import { useButton } from '@react-aria/button';
import { useCalendar, useCalendarCell, useCalendarGrid } from '@react-aria/calendar';
import { I18nProvider } from '@react-aria/i18n';
import { useCalendarState, type CalendarState as CalendarStateType } from '@react-stately/calendar';
import { useMemo, useRef, useState } from 'react';

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

const LOCALE = 'ko-KR';
const DATE_PICKER_ROW_HEIGHT = 52;
const DATE_PICKER_VISIBLE_COUNT = 16;
const DATE_PICKER_YEAR_RANGE = 100;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toCalendarDate(date: Date) {
  const localDate = fromDateToLocal(startOfDay(date));

  return new CalendarDate(localDate.year, localDate.month, localDate.day);
}

function toDate(date: CalendarDate) {
  return date.toDate(getLocalTimeZone());
}

function isSameDate(firstDate: CalendarDate | null, secondDate: CalendarDate) {
  return firstDate?.compare(secondDate) === 0;
}

type DatePickerColumnName = 'year' | 'month';

type PickerColumnProps = {
  'aria-label': string;
  className?: string;
  disabled: boolean;
  name: DatePickerColumnName;
  onValueChange: (value: number) => void;
  options: WheelPickerOption<number>[];
  value: number;
};

function createWheelOption(
  value: number,
  label: string,
  disabled = false,
): WheelPickerOption<number> {
  return {
    disabled,
    label: (
      <Text as="span" className="date-picker-wheel-text" variant="t11Regular">
        {label}
      </Text>
    ),
    textValue: label,
    value,
  };
}

function PickerColumn({
  'aria-label': ariaLabel,
  className,
  disabled,
  name,
  onValueChange,
  options,
  value,
}: PickerColumnProps) {
  const selectedLabel =
    options.find((option) => option.value === value)?.textValue ?? String(value);

  return (
    <div
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-disabled={disabled || undefined}
      aria-valuetext={selectedLabel}
      className={cn(
        'date-picker-wheel absolute inset-y-0 z-10 w-1/2 touch-none',
        disabled && 'pointer-events-none',
        className,
      )}
      data-selected-value={value}
      role="listbox"
    >
      <WheelPicker
        classNames={{
          highlightItem: 'date-picker-wheel-highlight flex justify-center',
          highlightWrapper: 'date-picker-wheel-highlight-wrapper',
          optionItem: 'date-picker-wheel-option flex justify-center',
        }}
        defaultValue={value}
        onValueChange={onValueChange}
        optionItemHeight={DATE_PICKER_ROW_HEIGHT}
        options={options}
        visibleCount={DATE_PICKER_VISIBLE_COUNT}
        key={`${name}-${value}`}
      />
    </div>
  );
}

type CalendarCellProps = {
  date: CalendarDate;
  isOutsideMonth: boolean;
  state: CalendarStateType<'single'>;
  today: CalendarDate;
};

function CalendarCell({ date, isOutsideMonth, state, today }: CalendarCellProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { cellProps, buttonProps, isDisabled, isFocused, isSelected, isUnavailable } =
    useCalendarCell({ date, isOutsideMonth }, state, ref);

  if (isOutsideMonth) {
    return <div {...cellProps} aria-hidden="true" className="h-[52px]" />;
  }

  const isToday = isSameDate(today, date);
  const isDateDisabled = isDisabled || isUnavailable;

  return (
    <div {...cellProps} className="flex h-[52px] items-center justify-center">
      <button
        {...buttonProps}
        aria-current={isToday ? 'date' : undefined}
        aria-label={`${date.year}년 ${date.month}월 ${date.day}일`}
        aria-selected={isSelected}
        className={cn(
          'relative inline-flex size-[48px] items-center justify-center rounded-full text-[var(--color-fg-neutral)] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
          'active:bg-[var(--color-bg-transparent-pressed)]',
          isToday && !isSelected && 'bg-[var(--color-bg-brand-weak)]',
          isSelected && 'bg-[var(--color-bg-brand-solid)] text-[var(--color-fg-neutral-inverted)]',
          isDateDisabled && 'cursor-not-allowed text-[var(--color-fg-disabled)]',
          isFocused && 'focus-visible:outline-2',
        )}
        disabled={isDateDisabled}
        ref={ref}
        type="button"
      >
        <Text
          as="span"
          className="relative z-10"
          variant="t6Regular"
          color={isSelected ? 'fg.neutralInverted' : undefined}
        >
          {date.day}
        </Text>
      </button>
    </div>
  );
}

type CalendarGridProps = {
  state: CalendarStateType<'single'>;
  today: CalendarDate;
  year: number;
  month: number;
  ariaLabel: string;
};

function CalendarGrid({ state, today, year, month, ariaLabel }: CalendarGridProps) {
  const { gridProps, headerProps, weekDays, weeksInMonth } = useCalendarGrid(
    { firstDayOfWeek: 'sun', weekdayStyle: 'short' },
    state,
  );
  const firstVisibleDate = state.visibleRange.start;

  return (
    <>
      <div
        {...headerProps}
        className="grid h-[28px] grid-cols-7 text-center text-[var(--color-fg-neutral-subtle)]"
      >
        {weekDays.map((weekday, index) => (
          <Text as="span" fontWeight="medium" key={`${weekday}-${index}`} variant="t5Regular">
            {weekday}
          </Text>
        ))}
      </div>
      <div {...gridProps} aria-label={ariaLabel} className="grid">
        {Array.from({ length: weeksInMonth }, (_, weekIndex) => (
          <div className="grid grid-cols-7" key={`week-${weekIndex}`} role="row">
            {state.getDatesInWeek(weekIndex, firstVisibleDate).map((date, dateIndex) => {
              if (!date) {
                return <div aria-hidden="true" className="h-[52px]" key={`empty-${dateIndex}`} />;
              }

              return (
                <CalendarCell
                  date={date}
                  isOutsideMonth={date.year !== year || date.month !== month}
                  key={date.toString()}
                  state={state}
                  today={today}
                />
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function getYearOptions(
  selectedYear: number,
  minimumDate?: CalendarDate,
  maximumDate?: CalendarDate,
) {
  const firstYear = minimumDate?.year ?? selectedYear - DATE_PICKER_YEAR_RANGE;
  const lastYear = maximumDate?.year ?? selectedYear + DATE_PICKER_YEAR_RANGE;

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;

    return createWheelOption(year, `${year}년`);
  });
}

function isMonthDisabled(
  year: number,
  month: number,
  minimumDate?: CalendarDate,
  maximumDate?: CalendarDate,
) {
  const isBeforeMinimum =
    minimumDate !== undefined &&
    (year < minimumDate.year || (year === minimumDate.year && month < minimumDate.month));
  const isAfterMaximum =
    maximumDate !== undefined &&
    (year > maximumDate.year || (year === maximumDate.year && month > maximumDate.month));

  return isBeforeMinimum || isAfterMaximum;
}

function getMonthOptions(year: number, minimumDate?: CalendarDate, maximumDate?: CalendarDate) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return createWheelOption(
      month,
      `${month}월`,
      isMonthDisabled(year, month, minimumDate, maximumDate),
    );
  });
}

function getSelectableMonth(
  year: number,
  month: number,
  minimumDate?: CalendarDate,
  maximumDate?: CalendarDate,
) {
  const minimumMonth = minimumDate?.year === year ? minimumDate.month : 1;
  const maximumMonth = maximumDate?.year === year ? maximumDate.month : 12;

  return Math.min(maximumMonth, Math.max(minimumMonth, month));
}

function DatePickerContent({
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
  const normalizedToday = toCalendarDate(today);
  const initialDate = toCalendarDate(value ?? defaultValue ?? today);
  const [internalValue, setInternalValue] = useState<CalendarDate | null>(
    defaultValue ? initialDate : normalizedToday,
  );
  const controlledValue = useMemo(() => (value ? toCalendarDate(value) : null), [value]);
  const currentValue = value === undefined ? internalValue : controlledValue;
  const minimumDate = useMemo(() => (minDate ? toCalendarDate(minDate) : undefined), [minDate]);
  const maximumDate = useMemo(() => (maxDate ? toCalendarDate(maxDate) : undefined), [maxDate]);
  const [isYearMonthOpen, setIsYearMonthOpen] = useState(false);

  const handleValueChange = (nextValue: CalendarDate | null) => {
    if (!nextValue) {
      return;
    }

    const nextDate = toDate(nextValue);

    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextDate);
  };

  const calendarOptions = {
    defaultFocusedValue: normalizedToday,
    selectionMode: 'single' as const,
    value: currentValue,
    onChange: handleValueChange,
    minValue: minimumDate,
    maxValue: maximumDate,
    isDisabled: disabled,
    firstDayOfWeek: 'sun' as const,
  };
  const state = useCalendarState({
    ...calendarOptions,
    locale: LOCALE,
    createCalendar,
  });
  const { calendarProps, nextButtonProps, prevButtonProps } = useCalendar(
    { ...calendarOptions, 'aria-label': ariaLabel },
    state,
  );
  const previousButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: previousButtonAriaProps } = useButton(prevButtonProps, previousButtonRef);
  const { buttonProps: nextButtonAriaProps } = useButton(nextButtonProps, nextButtonRef);

  const selectedMonth = state.focusedDate.month;
  const selectedYear = state.focusedDate.year;
  const years = getYearOptions(selectedYear, minimumDate, maximumDate);
  const months = getMonthOptions(selectedYear, minimumDate, maximumDate);

  const updateVisibleMonth = (year: number, month: number) => {
    const nextFocusedDate = new CalendarDate(
      year,
      getSelectableMonth(year, month, minimumDate, maximumDate),
      1,
    );

    state.setFocusedDate(nextFocusedDate);
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
      <div
        {...calendarProps}
        className="min-h-[388px] rounded-[20px] bg-[var(--color-bg-layer-default)] px-[24px] pt-[16px] pb-[16px]"
      >
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
              size={16}
            />
          </button>

          <div className="flex items-center gap-[38px]">
            <button
              {...previousButtonAriaProps}
              aria-label="이전 달"
              className="inline-flex size-[24px] items-center justify-center rounded-full text-[var(--color-fg-neutral-muted)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
              disabled={disabled || prevButtonProps.isDisabled}
              ref={previousButtonRef}
              type="button"
            >
              <Icon aria-hidden="true" name="chevronLeft" size={16} />
            </button>
            <button
              {...nextButtonAriaProps}
              aria-label="다음 달"
              className="inline-flex size-[24px] items-center justify-center rounded-full text-[var(--color-fg-neutral)] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
              disabled={disabled || nextButtonProps.isDisabled}
              ref={nextButtonRef}
              type="button"
            >
              <Icon aria-hidden="true" name="chevronRight" size={16} />
            </button>
          </div>
        </div>

        <div id="date-picker-content" className="mt-[20px]">
          {isYearMonthOpen ? (
            <div className="relative h-[260px] overflow-hidden" data-date-picker-panel="year-month">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[104px] z-0 h-[52px] rounded-[12px] bg-[var(--color-bg-neutral-weak)]"
              />
              <WheelPickerWrapper className="date-picker-wheel-wrapper absolute inset-0 z-10">
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
              </WheelPickerWrapper>
              <ScrollFog />
            </div>
          ) : (
            <CalendarGrid
              ariaLabel={`${selectedYear}년 ${selectedMonth}월`}
              month={selectedMonth}
              state={state}
              today={normalizedToday}
              year={selectedYear}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function DatePicker(props: DatePickerProps) {
  return (
    <I18nProvider locale={LOCALE}>
      <DatePickerContent {...props} />
    </I18nProvider>
  );
}
