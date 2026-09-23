import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';

import { BottomSheet, type BottomSheetProps } from './bottom-sheet';
import { Button } from './button';
import { DatePicker, type DatePickerProps } from './date-picker';
import { Icon } from './icon';
import { InputButton, type InputButtonProps } from './input-button';

export type DateInputButtonBottomSheetProps = Omit<
  BottomSheetProps,
  'children' | 'defaultOpen' | 'open' | 'onOpenChange' | 'title'
>;

export type DateInputButtonDatePickerProps = Omit<
  DatePickerProps,
  'aria-label' | 'defaultValue' | 'onValueChange' | 'value'
>;

export type DateInputButtonProps = Omit<
  InputButtonProps,
  'placeholder' | 'prefix' | 'suffix' | 'value'
> & {
  value?: Date | null;
  formatValue?: (value: Date) => ReactNode;
  placeholder?: ReactNode;
  prefix?: ReactNode | null;
  suffix?: ReactNode | null;
  onValueChange?: (value: Date | null) => void;
  bottomSheetTitle?: ReactNode;
  bottomSheetProps?: DateInputButtonBottomSheetProps;
  datePickerProps?: DateInputButtonDatePickerProps;
};

function formatDateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

function getDefaultDateValue(today?: Date) {
  const date = today ?? new Date();

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export const DateInputButton = forwardRef<ComponentRef<typeof InputButton>, DateInputButtonProps>(
  (
    {
      'aria-label': ariaLabel = '날짜 선택',
      bottomSheetProps,
      bottomSheetTitle = '날짜',
      clearButton = true,
      datePickerProps,
      formatValue = formatDateValue,
      onClear,
      onClick,
      onValueChange,
      placeholder = '날짜를 선택해 주세요',
      prefix = <Icon aria-hidden="true" name="calendarDays" size={20} />,
      suffix = null,
      value,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<Date | null>(null);
    const [draftValue, setDraftValue] = useState(() => getDefaultDateValue(datePickerProps?.today));
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const isControlled = value !== undefined;
    const selectedValue = isControlled ? (value ?? null) : internalValue;

    const openSheet = () => {
      setDraftValue(selectedValue ?? getDefaultDateValue(datePickerProps?.today));
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
      setDraftValue(getDefaultDateValue(datePickerProps?.today));
    };

    const resolvedBottomSheetProps: DateInputButtonBottomSheetProps = {
      defaultSnapPoint: 0.9,
      minHeight: 'auto',
      snapPoints: [0.7, 0.9],
      ...bottomSheetProps,
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
          {...resolvedBottomSheetProps}
          dismissible
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          title={bottomSheetTitle}
        >
          <div className="flex flex-col items-center gap-4 px-5 pt-4 pb-5">
            <DatePicker
              {...datePickerProps}
              aria-label="날짜 선택"
              onValueChange={setDraftValue}
              value={draftValue}
            />
            <div className="flex w-full gap-3" data-testid="date-input-button-actions">
              <Button
                className="!w-[30%]"
                onClick={handleReset}
                type="button"
                variant="neutral-weak"
                width="fill"
              >
                초기화
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                type="button"
                variant="neutral-solid"
                width="fill"
              >
                확인
              </Button>
            </div>
          </div>
        </BottomSheet>
      </>
    );
  },
);

DateInputButton.displayName = 'DateInputButton';
