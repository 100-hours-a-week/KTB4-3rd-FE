import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './radio.module.css';
import { Text } from './text';

export type RadioSize = 'medium' | 'large';
export type RadioWeight = 'regular' | 'bold';
export type RadioSelectionColor = 'default' | 'brand';

type BaseRadioProps = ComponentPropsWithoutRef<typeof BaseRadio.Root>;

type RadioOwnProps = {
  label?: ReactNode;
  size?: RadioSize;
  weight?: RadioWeight;
  selectionColor?: RadioSelectionColor;
  className?: string;
};

export type RadioProps = Omit<BaseRadioProps, 'children' | 'className'> & RadioOwnProps;

type BaseRadioGroupProps = ComponentPropsWithoutRef<typeof BaseRadioGroup>;

export type RadioGroupProps = Omit<BaseRadioGroupProps, 'className'> & {
  className?: string;
};

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

export const RadioGroup = forwardRef<ComponentRef<typeof BaseRadioGroup>, RadioGroupProps>(
  ({ className, ...props }, ref) => (
    <BaseRadioGroup {...props} className={cn('flex flex-col', className)} ref={ref} />
  ),
);

RadioGroup.displayName = 'RadioGroup';

export const Radio = forwardRef<ComponentRef<typeof BaseRadio.Root>, RadioProps>(
  (
    {
      'aria-labelledby': ariaLabelledBy,
      className,
      disabled = false,
      id,
      label = 'Radio option',
      size = 'medium',
      selectionColor = 'default',
      value,
      weight = 'regular',
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;
    const labelId = `${radioId}-label`;
    const combinedAriaLabelledBy = [labelId, ariaLabelledBy].filter(Boolean).join(' ') || undefined;

    return (
      <label
        className={cn(
          styles.row,
          'group/radio flex w-fit cursor-pointer items-center gap-[var(--dimension-x2)] py-[var(--dimension-x1)]',
          className,
        )}
        htmlFor={radioId}
      >
        <BaseRadio.Root
          {...props}
          aria-labelledby={combinedAriaLabelledBy}
          className={styles.root}
          data-selection-color={selectionColor}
          data-size={size}
          disabled={disabled}
          id={radioId}
          ref={ref}
          value={value}
        >
          <BaseRadio.Indicator className={styles.indicator} keepMounted />
        </BaseRadio.Root>

        <Text
          as="span"
          className={cn(styles.label, 'whitespace-nowrap')}
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
