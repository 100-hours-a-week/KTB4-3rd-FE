import { forwardRef, type ComponentRef, type ReactNode } from 'react';

import { Icon } from './icon';
import { InputButton, type InputButtonProps } from './input-button';

export type LocationInputButtonProps = Omit<
  InputButtonProps,
  'placeholder' | 'prefix' | 'suffix' | 'value'
> & {
  value?: string | null;
  placeholder?: ReactNode;
  prefix?: ReactNode | null;
  suffix?: ReactNode | null;
};

export const LocationInputButton = forwardRef<
  ComponentRef<typeof InputButton>,
  LocationInputButtonProps
>(
  (
    {
      'aria-label': ariaLabel = '장소 선택',
      clearButton = true,
      placeholder = '장소를 선택해 주세요',
      prefix = <Icon aria-hidden="true" name="search" size={20} />,
      suffix = null,
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
      value={value}
    />
  ),
);

LocationInputButton.displayName = 'LocationInputButton';
