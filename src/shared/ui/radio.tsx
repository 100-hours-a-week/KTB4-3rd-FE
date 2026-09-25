import {
  forwardRef,
  useId,
  type ChangeEventHandler,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

import styles from './radio.module.css';

export type RadioSize = 'medium' | 'large';
export type RadioWeight = 'regular' | 'bold';
export type RadioSelectionColor = 'figma' | 'brand';

type RadioInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'children' | 'className' | 'size' | 'type'
>;

type RadioOwnProps = {
  /** Label rendered next to the radio button. */
  label?: ReactNode;
  /** Radio mark size from the design. */
  size?: RadioSize;
  /** Label font weight from the design. */
  weight?: RadioWeight;
  /** Color used for the selected radio mark. */
  selectionColor?: RadioSelectionColor;
  /** Class applied to the radio row. */
  className?: string;
  /** Called when this radio becomes selected. */
  onCheckedChange?: (checked: boolean) => void;
};

export type RadioProps = RadioInputProps & RadioOwnProps;

const textVariantBySizeAndWeight: Record<
  RadioSize,
  Record<RadioWeight, 't4Regular' | 't4Bold' | 't5Regular' | 't5Bold'>
> = {
  medium: {
    regular: 't4Regular',
    bold: 't4Bold',
  },
  large: {
    regular: 't5Regular',
    bold: 't5Bold',
  },
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      'aria-labelledby': ariaLabelledBy,
      checked,
      className,
      defaultChecked,
      disabled = false,
      id,
      label = 'Radio option',
      onChange,
      onCheckedChange,
      required,
      size = 'medium',
      selectionColor = 'figma',
      weight = 'regular',
      ...inputProps
    },
    ref,
  ) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;
    const labelId = `${radioId}-label`;
    const combinedAriaLabelledBy = [labelId, ariaLabelledBy].filter(Boolean).join(' ') || undefined;
    const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
      onChange?.(event);

      if (event.currentTarget.checked) {
        onCheckedChange?.(true);
      }
    };

    return (
      <label
        className={cn(
          styles.row,
          'group/radio flex w-fit cursor-pointer items-center gap-[var(--dimension-x2)] py-[var(--dimension-x1)]',
          'data-[disabled]:cursor-not-allowed',
          className,
        )}
        data-disabled={disabled || undefined}
        htmlFor={radioId}
      >
        <input
          {...inputProps}
          aria-labelledby={combinedAriaLabelledBy}
          checked={checked}
          className={styles.input}
          defaultChecked={defaultChecked}
          disabled={disabled}
          id={radioId}
          onChange={handleChange}
          ref={ref}
          required={required}
          type="radio"
        />

        <span
          aria-hidden="true"
          className={styles.mark}
          data-selection-color={selectionColor}
          data-size={size}
        />

        <Text
          as="span"
          className="whitespace-nowrap group-data-[disabled]/radio:text-[var(--color-fg-disabled)]"
          id={labelId}
          variant={textVariantBySizeAndWeight[size][weight]}
        >
          {label}
        </Text>
      </label>
    );
  },
);

Radio.displayName = 'Radio';
