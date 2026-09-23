import { useState } from 'react';
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from '@ncdai/react-wheel-picker';

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

type TimePickerColumnName = 'period' | 'hour' | 'minute';

type TimePickerColumnProps = {
  'aria-label': string;
  className: string;
  disabled: boolean;
  infinite?: boolean;
  name: TimePickerColumnName;
  onValueChange: (value: string) => void;
  options: WheelPickerOption<string>[];
  value: string;
};

const TIME_PERIODS = ['오전', '오후'] as const satisfies readonly TimePeriod[];
const TIME_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const satisfies readonly TimeHour[];
const TIME_MINUTES = [0, 10, 20, 30, 40, 50] as const satisfies readonly TimeMinute[];

export const DEFAULT_TIME_PICKER_VALUE: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

const TIME_PICKER_ROW_HEIGHT = 42;

function createWheelOption(value: string, label: string): WheelPickerOption<string> {
  return {
    label: (
      <Text as="span" className="time-picker-wheel-text" variant="t8Regular">
        {label}
      </Text>
    ),
    textValue: label,
    value,
  };
}

const PERIOD_OPTIONS: WheelPickerOption<string>[] = TIME_PERIODS.map((value) =>
  createWheelOption(value, value),
);
const HOUR_OPTIONS: WheelPickerOption<string>[] = TIME_HOURS.map((value) =>
  createWheelOption(String(value), String(value)),
);
const MINUTE_OPTIONS: WheelPickerOption<string>[] = TIME_MINUTES.map((value) => {
  const label = value.toString().padStart(2, '0');
  return createWheelOption(String(value), label);
});

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
    period: isTimePeriod(value?.period) ? value.period : DEFAULT_TIME_PICKER_VALUE.period,
    hour: isTimeHour(value?.hour) ? value.hour : DEFAULT_TIME_PICKER_VALUE.hour,
    minute: isTimeMinute(value?.minute) ? value.minute : DEFAULT_TIME_PICKER_VALUE.minute,
  };
}

function getColumnValue(value: TimePickerValue, name: TimePickerColumnName) {
  if (name === 'period') {
    return value.period;
  }

  if (name === 'hour') {
    return String(value.hour);
  }

  return String(value.minute);
}

function getColumnLayout(name: TimePickerColumnName) {
  if (name === 'period') {
    return { left: '41px', width: '102px' };
  }

  if (name === 'hour') {
    return { left: '135px', width: '82px' };
  }

  return { left: '199px', width: '98px' };
}

function TimePickerColumn({
  'aria-label': ariaLabel,
  className,
  disabled,
  infinite = false,
  name,
  onValueChange,
  options,
  value,
}: TimePickerColumnProps) {
  const layout = getColumnLayout(name);
  const selectedLabel = options.find((option) => option.value === value)?.textValue ?? value;

  return (
    <div
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuetext={selectedLabel}
      className={cn(
        'time-picker-wheel absolute top-0 h-[224px] touch-none',
        disabled && 'pointer-events-none',
        className,
      )}
      data-selected-value={value}
      role="listbox"
      style={{ left: layout.left, width: layout.width }}
    >
      <WheelPicker
        classNames={{
          highlightItem: 'time-picker-wheel-highlight flex justify-center',
          highlightWrapper: 'time-picker-wheel-highlight-wrapper z-10 rounded-[12px] bg-[#eaecf0]',
          optionItem: 'time-picker-wheel-option flex justify-center',
        }}
        infinite={infinite}
        onValueChange={onValueChange}
        optionItemHeight={TIME_PICKER_ROW_HEIGHT}
        options={options}
        value={value}
        visibleCount={16}
      />
    </div>
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
  const [internalValue, setInternalValue] = useState(() =>
    normalizeTimeValue(defaultValue ?? DEFAULT_TIME_PICKER_VALUE),
  );
  const currentValue = value === undefined ? internalValue : normalizeTimeValue(value);

  const updateColumnValue = (name: TimePickerColumnName, nextValue: string) => {
    const nextTime = normalizeTimeValue({
      ...currentValue,
      [name]: name === 'hour' || name === 'minute' ? Number(nextValue) : nextValue,
    });

    if (value === undefined) {
      setInternalValue(nextTime);
    }

    onValueChange?.(nextTime);
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

      <WheelPickerWrapper className="time-picker-wheel-wrapper absolute inset-0 z-10">
        <TimePickerColumn
          aria-label="오전 또는 오후"
          className="left-[41px] w-[102px]"
          disabled={disabled}
          name="period"
          onValueChange={(nextValue) => updateColumnValue('period', nextValue)}
          options={PERIOD_OPTIONS}
          value={getColumnValue(currentValue, 'period')}
        />
        <TimePickerColumn
          aria-label="시"
          className="left-[135px] w-[82px]"
          disabled={disabled}
          infinite
          name="hour"
          onValueChange={(nextValue) => updateColumnValue('hour', nextValue)}
          options={HOUR_OPTIONS}
          value={getColumnValue(currentValue, 'hour')}
        />
        <TimePickerColumn
          aria-label="분"
          className="left-[199px] w-[98px]"
          disabled={disabled}
          infinite
          name="minute"
          onValueChange={(nextValue) => updateColumnValue('minute', nextValue)}
          options={MINUTE_OPTIONS}
          value={getColumnValue(currentValue, 'minute')}
        />
      </WheelPickerWrapper>

      <ScrollFog />
    </div>
  );
}
