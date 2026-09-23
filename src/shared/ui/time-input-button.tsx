import { forwardRef, type ComponentRef, type ReactNode } from 'react';

import { Icon } from './icon';
import { InputButton, type InputButtonProps } from './input-button';
import type { TimePickerValue } from './time-picker';

export type TimeInputButtonProps = Omit<
  InputButtonProps,
  'placeholder' | 'prefix' | 'suffix' | 'value'
> & {
  value?: TimePickerValue | null;
  formatValue?: (value: TimePickerValue) => ReactNode;
  placeholder?: ReactNode;
  prefix?: ReactNode | null;
  suffix?: ReactNode | null;
};

function formatTimeValue(value: TimePickerValue) {
  return `${value.period} ${value.hour}:${String(value.minute).padStart(2, '0')}`;
}

export const TimeInputButton = forwardRef<ComponentRef<typeof InputButton>, TimeInputButtonProps>(
  (
    {
      'aria-label': ariaLabel = '시간 선택',
      clearButton = true,
      formatValue = formatTimeValue,
      placeholder = '시간을 선택해 주세요',
      prefix = <Icon aria-hidden="true" name="clock3" size={20} />,
      suffix = <Icon aria-hidden="true" name="chevronDown" size={20} />,
      value,
      ...props
    },
    ref,
  ) => (
    <InputButton
      {...props}
      aria-label={ariaLabel}
      clearButton={clearButton}
      placeholder={placeholder}
      prefix={prefix}
      ref={ref}
      suffix={suffix}
      value={value === null || value === undefined ? null : formatValue(value)}
    />
  ),
);

TimeInputButton.displayName = 'TimeInputButton';
