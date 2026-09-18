import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import {
  forwardRef,
  useId,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';
import { Text } from './text';

type BaseCheckboxProps = ComponentPropsWithoutRef<typeof BaseCheckbox.Root>;

export type CheckboxRequirement = 'required' | 'optional';
export type CheckboxWeight = 'regular' | 'bold';

type CheckboxOwnProps = {
  /** Label rendered next to the checkbox. */
  label?: ReactNode;
  /** Requirement marker shown after the label. */
  requirement?: CheckboxRequirement | null;
  /** Label font weight. */
  weight?: CheckboxWeight;
  /** Class applied to the checkbox row. */
  className?: string;
  /** Called with the next checked value. */
  onCheckedChange?: (checked: boolean) => void;
};

export type CheckboxProps = Omit<
  BaseCheckboxProps,
  'children' | 'className' | 'indeterminate' | 'onCheckedChange'
> &
  CheckboxOwnProps;

export const Checkbox = forwardRef<ComponentRef<typeof BaseCheckbox.Root>, CheckboxProps>(
  (
    {
      id,
      label = '서비스 이용약관 동의',
      requirement = 'required',
      weight = 'regular',
      className,
      required,
      onCheckedChange,
      'aria-labelledby': ariaLabelledBy,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const labelId = `${checkboxId}-label`;
    const isRequired = required ?? requirement === 'required';
    const combinedAriaLabelledBy = [labelId, ariaLabelledBy].filter(Boolean).join(' ') || undefined;

    return (
      <label
        className={cn(
          'group/checkbox flex min-h-[52px] w-full cursor-pointer items-center gap-[var(--dimension-x2)]',
          'data-[disabled]:cursor-not-allowed',
          className,
        )}
        data-disabled={disabled || undefined}
        htmlFor={checkboxId}
      >
        <BaseCheckbox.Root
          {...props}
          aria-labelledby={combinedAriaLabelledBy}
          className={cn(
            'inline-flex size-[24px] shrink-0 items-center justify-center overflow-clip rounded-[6px] border transition-colors',
            'border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]',
            'data-[checked]:border-transparent data-[checked]:bg-[var(--color-bg-brand-solid)]',
            'data-[disabled]:cursor-not-allowed data-[disabled]:border-[var(--color-fg-disabled)] data-[disabled]:bg-[var(--color-bg-disabled)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
          )}
          disabled={disabled}
          id={checkboxId}
          onCheckedChange={onCheckedChange ? (checked) => onCheckedChange(checked) : undefined}
          ref={ref}
          required={isRequired}
        >
          <BaseCheckbox.Indicator className="inline-flex size-[14px] items-center justify-center text-[var(--color-fg-neutral-inverted)] data-[disabled]:text-[var(--color-fg-disabled)]">
            <Icon aria-hidden="true" name="checkmark" size={14} />
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>

        <span className="flex min-w-0 flex-1 items-center gap-[var(--dimension-x2)]">
          <Text
            as="span"
            className="min-w-0 break-words group-data-[disabled]/checkbox:text-[var(--color-fg-disabled)]"
            id={labelId}
            variant={weight === 'bold' ? 't5Bold' : 't5Regular'}
          >
            {label}
          </Text>
          {requirement ? (
            <Text
              as="span"
              className="shrink-0 group-data-[disabled]/checkbox:text-[var(--color-fg-disabled)]"
              color="fg.neutralMuted"
              variant="t3Regular"
            >
              ({requirement === 'required' ? '필수' : '선택'})
            </Text>
          ) : null}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';
