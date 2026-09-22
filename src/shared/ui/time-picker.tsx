import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Picker, { type PickerValue } from 'react-mobile-picker';

import { cn } from '@/shared/lib/cn';

import { ScrollFog } from './scroll-fog';
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

type PickerColumnName = 'period' | 'hour' | 'minute';

type PickerOption = {
  actualValue: string;
  label: string;
  value: string;
};

type TimePickerSelection = Record<PickerColumnName, string>;

const TIME_PERIODS = ['오전', '오후'] as const satisfies readonly TimePeriod[];
const TIME_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly TimeHour[];
const TIME_MINUTES = [0, 10, 20, 30, 40, 50] as const satisfies readonly TimeMinute[];

const DEFAULT_TIME: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

const TIME_PICKER_HEIGHT = 224;
const TIME_PICKER_ROW_HEIGHT = 42;
const CYCLIC_OPTION_REPEAT_COUNT = 21;
const CYCLIC_OPTION_MIDDLE_INDEX = Math.floor(CYCLIC_OPTION_REPEAT_COUNT / 2);

function isTimePeriod(value: string | undefined): value is TimePeriod {
  return value === '오전' || value === '오후';
}

function isTimeHour(value: number | undefined): value is TimeHour {
  return value !== undefined && TIME_HOURS.includes(value as TimeHour);
}

function isTimeMinute(value: number | undefined): value is TimeMinute {
  return value !== undefined && TIME_MINUTES.includes(value as TimeMinute);
}

function normalizeTimeValue(value?: Partial<TimePickerValue>): TimePickerValue {
  return {
    period: isTimePeriod(value?.period) ? value.period : DEFAULT_TIME.period,
    hour: isTimeHour(value?.hour) ? value.hour : DEFAULT_TIME.hour,
    minute: isTimeMinute(value?.minute) ? value.minute : DEFAULT_TIME.minute,
  };
}

function formatMinute(minute: TimeMinute) {
  return minute.toString().padStart(2, '0');
}

function createOptions(
  values: readonly string[],
  cyclic: boolean,
  formatLabel = (value: string) => value,
) {
  if (!cyclic) {
    return values.map((value) => ({
      actualValue: value,
      label: formatLabel(value),
      value,
    }));
  }

  return Array.from({ length: CYCLIC_OPTION_REPEAT_COUNT }, (_, cycle) =>
    values.map((value) => ({
      actualValue: value,
      label: formatLabel(value),
      value: `${cycle}-${value}`,
    })),
  ).flat();
}

const PERIOD_OPTIONS = createOptions([...TIME_PERIODS], false);
const HOUR_OPTIONS = createOptions(TIME_HOURS.map(String), true);
const MINUTE_OPTIONS = createOptions(TIME_MINUTES.map(formatMinute), true);

function getMiddleOption(options: readonly PickerOption[], actualValue: string) {
  const optionIndex = options.findIndex(
    (option) =>
      option.actualValue === actualValue &&
      option.value.startsWith(`${CYCLIC_OPTION_MIDDLE_INDEX}-`),
  );

  if (optionIndex >= 0) {
    return options[optionIndex].value;
  }

  return options.find((option) => option.actualValue === actualValue)?.value ?? options[0].value;
}

function getActualValue(
  options: readonly PickerOption[],
  pickerValue: string | number | undefined,
) {
  return options.find((option) => option.value === String(pickerValue))?.actualValue;
}

function getPickerSelection(value: TimePickerValue): TimePickerSelection {
  return {
    period: getMiddleOption(PERIOD_OPTIONS, value.period),
    hour: getMiddleOption(HOUR_OPTIONS, String(value.hour)),
    minute: getMiddleOption(MINUTE_OPTIONS, formatMinute(value.minute)),
  };
}

function getTimeValue(selection: PickerValue): TimePickerValue {
  const period = getActualValue(PERIOD_OPTIONS, selection.period);
  const hour = Number(getActualValue(HOUR_OPTIONS, selection.hour));
  const minute = Number(getActualValue(MINUTE_OPTIONS, selection.minute));

  return normalizeTimeValue({
    period: isTimePeriod(period) ? period : undefined,
    hour: isTimeHour(hour) ? hour : undefined,
    minute: isTimeMinute(minute) ? minute : undefined,
  });
}

type TimePickerColumnProps = {
  'aria-label': string;
  className: string;
  disabled: boolean;
  left: string;
  name: PickerColumnName;
  onValueChange: (value: string) => void;
  options: readonly PickerOption[];
  value: string;
  width: string;
};

type PointerDragState = {
  lastStep: number;
  pointerId: number;
  startIndex: number;
  startY: number;
};

function TimePickerColumn({
  'aria-label': ariaLabel,
  className,
  disabled,
  left,
  name,
  onValueChange,
  options,
  value,
  width,
}: TimePickerColumnProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const pointerDragRef = useRef<PointerDragState | null>(null);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
      return;
    }

    event.preventDefault();

    const currentIndex = selectedIndex;
    const direction = event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex = Math.max(0, Math.min(options.length - 1, currentIndex + direction));

    onValueChange(options[nextIndex].value);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerDragRef.current = {
      lastStep: 0,
      pointerId: event.pointerId,
      startIndex: selectedIndex,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointerDrag = pointerDragRef.current;

    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const nextStep = Math.round((pointerDrag.startY - event.clientY) / TIME_PICKER_ROW_HEIGHT);

    if (nextStep === pointerDrag.lastStep) {
      return;
    }

    pointerDrag.lastStep = nextStep;
    const nextIndex = Math.max(0, Math.min(options.length - 1, pointerDrag.startIndex + nextStep));

    onValueChange(options[nextIndex].value);
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    pointerDragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <Picker.Column
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-orientation="vertical"
      className={cn('top-0', className)}
      name={name}
      onKeyDown={handleKeyDown}
      onPointerCancel={handlePointerEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      role="listbox"
      style={{
        flex: 'none',
        left,
        maxHeight: 'none',
        pointerEvents: disabled ? 'none' : undefined,
        position: 'absolute',
        top: 0,
        width,
      }}
      tabIndex={disabled ? -1 : 0}
    >
      {options.map((option, optionIndex) => {
        const isAccessibleOption = Math.abs(optionIndex - selectedIndex) <= 2;

        return (
          <Picker.Item
            aria-hidden={isAccessibleOption ? undefined : true}
            aria-label={option.label}
            aria-selected={value === option.value}
            className={cn(
              'w-full cursor-pointer rounded-[12px] outline-none transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
              'active:bg-[var(--color-bg-transparent-pressed)]',
              disabled && 'cursor-not-allowed',
            )}
            key={option.value}
            role="option"
            tabIndex={-1}
            value={option.value}
          >
            {({ selected }) => (
              <Text
                as="span"
                className="transition-[color,font-size,line-height,font-weight,transform] duration-200 ease-out"
                style={{
                  color: selected ? 'rgb(29, 41, 57)' : 'rgb(152, 162, 179)',
                  fontSize: selected ? '24px' : '22px',
                  fontWeight: selected ? 700 : 400,
                  lineHeight: selected ? '32px' : '30px',
                  transform: selected ? 'translateY(1px)' : undefined,
                }}
                variant="t8Regular"
              >
                {option.label}
              </Text>
            )}
          </Picker.Item>
        );
      })}
    </Picker.Column>
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
  const [pickerSelection, setPickerSelection] = useState<TimePickerSelection>(() =>
    getPickerSelection(currentValue),
  );
  const pickerValue: TimePickerSelection = {
    period:
      getActualValue(PERIOD_OPTIONS, pickerSelection.period) === currentValue.period
        ? pickerSelection.period
        : getMiddleOption(PERIOD_OPTIONS, currentValue.period),
    hour:
      getActualValue(HOUR_OPTIONS, pickerSelection.hour) === String(currentValue.hour)
        ? pickerSelection.hour
        : getMiddleOption(HOUR_OPTIONS, String(currentValue.hour)),
    minute:
      getActualValue(MINUTE_OPTIONS, pickerSelection.minute) === formatMinute(currentValue.minute)
        ? pickerSelection.minute
        : getMiddleOption(MINUTE_OPTIONS, formatMinute(currentValue.minute)),
  };

  const updateValue = (nextValue: TimePickerValue) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handlePickerChange = (nextPickerValue: PickerValue) => {
    const nextSelection: TimePickerSelection = {
      period: String(nextPickerValue.period),
      hour: String(nextPickerValue.hour),
      minute: String(nextPickerValue.minute),
    };

    setPickerSelection(nextSelection);
    updateValue(getTimeValue(nextSelection));
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

      <Picker
        className="z-10 [&>div:last-child]:hidden"
        height={TIME_PICKER_HEIGHT}
        itemHeight={TIME_PICKER_ROW_HEIGHT}
        onChange={handlePickerChange}
        style={{
          WebkitMaskImage: 'none',
          inset: 0,
          maskImage: 'none',
          position: 'absolute',
          width: '100%',
        }}
        value={pickerValue}
        wheelMode="normal"
      >
        <TimePickerColumn
          aria-label="오전 또는 오후"
          className="w-[102px]"
          disabled={disabled}
          left="41px"
          name="period"
          onValueChange={(nextValue) => handlePickerChange({ ...pickerValue, period: nextValue })}
          options={PERIOD_OPTIONS}
          value={pickerValue.period}
          width="102px"
        />
        <TimePickerColumn
          aria-label="시"
          className="w-[82px]"
          disabled={disabled}
          left="135px"
          name="hour"
          onValueChange={(nextValue) => handlePickerChange({ ...pickerValue, hour: nextValue })}
          options={HOUR_OPTIONS}
          value={pickerValue.hour}
          width="82px"
        />
        <TimePickerColumn
          aria-label="분"
          className="w-[98px]"
          disabled={disabled}
          left="199px"
          name="minute"
          onValueChange={(nextValue) => handlePickerChange({ ...pickerValue, minute: nextValue })}
          options={MINUTE_OPTIONS}
          value={pickerValue.minute}
          width="98px"
        />
      </Picker>

      <ScrollFog />
    </div>
  );
}
