import { forwardRef, type ComponentPropsWithoutRef, type Ref } from 'react';

import { cn } from '@/shared/lib/cn';

type TextareaOwnProps = {
  /** Controls the compact and roomy Figma height variants. */
  autoSize?: boolean;
  /** Visual invalid state. `aria-invalid` is also recognized when provided. */
  invalid?: boolean;
  /** Class applied to the native textarea element. */
  textareaClassName?: string;
  /** Class applied to the textarea surface. */
  className?: string;
};

export type TextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'className' | 'children' | 'value' | 'defaultValue' | 'onChange'
> &
  TextareaOwnProps & {
    value: string;
    onValueChange: (value: string) => void;
  };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      autoSize = true,
      className,
      disabled = false,
      invalid,
      readOnly = false,
      'aria-invalid': ariaInvalid,
      onValueChange,
      textareaClassName,
      value,
      ...props
    },
    ref: Ref<HTMLTextAreaElement>,
  ) => {
    const effectiveAriaInvalid = invalid === undefined ? ariaInvalid : invalid || undefined;
    const isInvalid = effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';

    return (
      <div className={cn('relative flex w-full items-start', className)}>
        <div
          className={cn(
            'flex w-full items-start overflow-hidden rounded-[14px] border bg-transparent px-[var(--dimension-x4)] py-[var(--dimension-x3_5)] transition-colors',
            autoSize ? 'h-[95px]' : 'h-[120px]',
            'border-[var(--color-stroke-neutral-weak)]',
            'focus-within:border-2 focus-within:border-[var(--color-stroke-neutral-contrast)]',
            'data-[invalid=true]:border-2 data-[invalid=true]:border-[var(--color-stroke-critical-solid)]',
            'data-[invalid=true]:focus-within:border-[var(--color-stroke-critical-solid)]',
            'data-[readonly=true]:bg-[var(--color-bg-disabled)] data-[readonly=true]:focus-within:border-[var(--color-stroke-neutral-weak)]',
            'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-[var(--color-bg-disabled)] data-[disabled=true]:focus-within:border-[var(--color-stroke-neutral-weak)]',
          )}
          data-disabled={disabled ? 'true' : undefined}
          data-invalid={isInvalid ? 'true' : undefined}
          data-readonly={readOnly ? 'true' : undefined}
        >
          <textarea
            {...props}
            ref={ref}
            aria-invalid={effectiveAriaInvalid}
            className={cn(
              'min-h-0 min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-[var(--font-size-t5)] leading-[var(--line-height-t5)] font-normal text-[var(--color-fg-neutral)] outline-none placeholder:text-[var(--color-fg-placeholder)]',
              'disabled:cursor-not-allowed disabled:text-[var(--color-fg-disabled)] disabled:placeholder:text-[var(--color-fg-disabled)]',
              'read-only:text-[var(--color-fg-neutral-muted)] read-only:placeholder:text-[var(--color-fg-neutral-muted)]',
              textareaClassName,
            )}
            disabled={disabled}
            onChange={(event) => onValueChange(event.currentTarget.value)}
            readOnly={readOnly}
            value={value}
          />
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
