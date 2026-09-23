import { forwardRef, type ComponentRef, type ReactNode } from 'react';

import { Icon } from './icon';
import { InputButton, type InputButtonProps } from './input-button';

export type DateInputButtonProps = Omit<
  InputButtonProps,
  'placeholder' | 'prefix' | 'suffix' | 'value'
> & {
  value?: Date | null;
  formatValue?: (value: Date) => ReactNode;
  placeholder?: ReactNode;
  prefix?: ReactNode | null;
  suffix?: ReactNode | null;
};

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

export const DateInputButton = forwardRef<ComponentRef<typeof InputButton>, DateInputButtonProps>(
  (
    {
      'aria-label': ariaLabel = '날짜 선택',
      clearButton = true,
      formatValue = formatDateValue,
      placeholder = '날짜를 선택해 주세요',
      prefix = <Icon aria-hidden="true" name="calendarDays" size={20} />,
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

DateInputButton.displayName = 'DateInputButton';
