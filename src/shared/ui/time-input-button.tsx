import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';

import { BottomSheet, type BottomSheetProps } from './bottom-sheet';
import { Button } from './button';
import { Icon } from './icon';
import { InputButton, type InputButtonProps } from './input-button';
import { DEFAULT_TIME_PICKER_VALUE, TimePicker, type TimePickerValue } from './time-picker';

export type TimeInputButtonBottomSheetProps = Omit<
  BottomSheetProps,
  'children' | 'defaultOpen' | 'open' | 'onOpenChange' | 'title'
>;

export type TimeInputButtonProps = Omit<
  InputButtonProps,
  'placeholder' | 'prefix' | 'suffix' | 'value'
> & {
  value?: TimePickerValue | null;
  formatValue?: (value: TimePickerValue) => ReactNode;
  placeholder?: ReactNode;
  prefix?: ReactNode | null;
  suffix?: ReactNode | null;
  onValueChange?: (value: TimePickerValue | null) => void;
  bottomSheetTitle?: ReactNode;
  bottomSheetProps?: TimeInputButtonBottomSheetProps;
};

function formatTimeValue(value: TimePickerValue) {
  return `${value.period} ${value.hour}:${String(value.minute).padStart(2, '0')}`;
}

export const TimeInputButton = forwardRef<ComponentRef<typeof InputButton>, TimeInputButtonProps>(
  (
    {
      'aria-label': ariaLabel = '시간 선택',
      bottomSheetProps,
      bottomSheetTitle = '시간',
      clearButton = true,
      formatValue = formatTimeValue,
      onClear,
      onClick,
      onValueChange,
      placeholder = '시간을 선택해 주세요',
      prefix = <Icon aria-hidden="true" name="clock3" size={20} />,
      suffix = <Icon aria-hidden="true" name="chevronDown" size={20} />,
      value,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<TimePickerValue | null>(null);
    const [draftValue, setDraftValue] = useState(DEFAULT_TIME_PICKER_VALUE);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? (value ?? null) : internalValue;

    const openSheet = () => {
      setDraftValue(selectedValue ?? DEFAULT_TIME_PICKER_VALUE);
      setIsSheetOpen(true);
    };

    const handleClick: NonNullable<InputButtonProps['onClick']> = (event) => {
      onClick?.(event);
      openSheet();
    };

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue(null);
      }
      onClear?.();
      onValueChange?.(null);
    };

    const handleConfirm = () => {
      if (!isControlled) {
        setInternalValue(draftValue);
      }
      onValueChange?.(draftValue);
      setIsSheetOpen(false);
    };

    const handleReset = () => {
      setDraftValue(DEFAULT_TIME_PICKER_VALUE);
    };

    return (
      <>
        <InputButton
          {...props}
          aria-label={ariaLabel}
          clearButton={clearButton}
          onClick={handleClick}
          onClear={handleClear}
          placeholder={placeholder}
          prefix={prefix}
          ref={ref}
          suffix={suffix}
          value={selectedValue === null ? null : formatValue(selectedValue)}
        />
        <BottomSheet
          {...bottomSheetProps}
          dismissible
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title={bottomSheetTitle}
        >
          <div className="flex flex-col items-center gap-4 px-5 pt-4 pb-5">
            <TimePicker aria-label="시간 선택" onValueChange={setDraftValue} value={draftValue} />
            <div className="flex w-full gap-3" data-testid="time-input-button-actions">
              <Button
                className="!w-[30%]"
                onClick={handleReset}
                type="button"
                variant="neutral-weak"
                width="fill"
              >
                초기화
              </Button>
              <Button className="flex-1" onClick={handleConfirm} type="button" width="fill">
                선택
              </Button>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  },
);

TimeInputButton.displayName = 'TimeInputButton';
