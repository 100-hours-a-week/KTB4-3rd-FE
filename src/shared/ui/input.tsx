import { Input as BaseInput } from '@base-ui/react/input';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
  useImperativeHandle,
  useRef,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

type InputOwnProps = {
  /** Content rendered before the input value. */
  prefix?: ReactNode | null;
  /** Content rendered after the input value. */
  suffix?: ReactNode | null;
  /** Optional clear-button content. Pass `true` to use the default icon. */
  clearButton?: ReactNode | null;
  /** Optional callback called after the value is cleared. */
  onClear?: () => void;
  /** Visual invalid state. `aria-invalid` is also recognized when provided. */
  invalid?: boolean;
  /** Keep the default border width while the input is focused. */
  disableFocusBorder?: boolean;
  /** Class applied to the native input element. */
  inputClassName?: string;
  /** Class applied to the input surface. */
  className?: string;
};

export type InputProps = Omit<
  ComponentPropsWithoutRef<typeof BaseInput>,
  | 'size'
  | 'className'
  | 'children'
  | 'prefix'
  | 'suffix'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onValueChange'
> &
  InputOwnProps & {
    value: string;
    onValueChange: (value: string) => void;
  };

function hasClearButton(clearButton: ReactNode | null | undefined) {
  return clearButton !== null && clearButton !== undefined && clearButton !== false;
}

function getClearButtonContent(clearButton: ReactNode | null | undefined) {
  if (clearButton === true) {
    return (
      <Icon
        aria-hidden="true"
        color="var(--color-fg-neutral-muted)"
        name="xmarkCircleFill"
        size={20}
      />
    );
  }

  return clearButton;
}

export const Input = forwardRef<ComponentRef<typeof BaseInput>, InputProps>(
  (
    {
      className,
      inputClassName,
      prefix,
      suffix,
      clearButton,
      onClear,
      invalid,
      disableFocusBorder = false,
      value,
      onValueChange,
      disabled = false,
      readOnly = false,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<ComponentRef<typeof BaseInput>>(null);

    useImperativeHandle(ref, () => inputRef.current as ComponentRef<typeof BaseInput>);

    const effectiveAriaInvalid = invalid === undefined ? ariaInvalid : invalid || undefined;
    const isInvalid = effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
    const shouldRenderClearButton =
      hasClearButton(clearButton) && value.length > 0 && !disabled && !readOnly;
    const clearButtonContent = getClearButtonContent(clearButton);
    const handleClear = () => {
      onValueChange('');
      inputRef.current?.focus();
      onClear?.();
    };

    return (
      <div className={cn('relative flex w-full items-start', className)}>
        <div
          className={cn(
            'flex h-[52px] w-full items-center gap-[var(--dimension-x2)] overflow-hidden rounded-[12px] border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)] px-[var(--dimension-x4)] py-[15px] transition-colors',
            !disableFocusBorder &&
              'focus-within:border-2 focus-within:border-[var(--color-stroke-neutral-contrast)]',
            'data-[invalid=true]:border-2 data-[invalid=true]:border-[var(--color-stroke-critical-solid)]',
            'data-[invalid=true]:focus-within:border-[var(--color-stroke-critical-solid)]',
            'data-[readonly=true]:bg-[var(--color-bg-neutral-weak)] data-[readonly=true]:focus-within:border-[var(--color-stroke-neutral-weak)]',
            'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-[var(--color-bg-disabled)] data-[disabled=true]:focus-within:border-[var(--color-stroke-neutral-weak)]',
          )}
          data-disabled={disabled ? 'true' : undefined}
          data-invalid={isInvalid ? 'true' : undefined}
          data-readonly={readOnly ? 'true' : undefined}
        >
          {prefix !== null && prefix !== undefined ? (
            <span className="inline-flex shrink-0 items-center justify-center">{prefix}</span>
          ) : null}
          <BaseInput
            {...props}
            ref={inputRef}
            aria-invalid={effectiveAriaInvalid}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent p-0 text-[var(--font-size-t4)] leading-[var(--line-height-t4)] font-normal text-[var(--color-fg-neutral)] outline-none placeholder:text-[var(--color-fg-placeholder)]',
              'disabled:cursor-not-allowed disabled:text-[var(--color-fg-disabled)] disabled:placeholder:text-[var(--color-fg-disabled)]',
              'read-only:text-[var(--color-fg-neutral)]',
              inputClassName,
            )}
            disabled={disabled}
            onValueChange={onValueChange}
            readOnly={readOnly}
            value={value}
          />
          {suffix !== null && suffix !== undefined ? (
            <span className="inline-flex shrink-0 items-center justify-center">{suffix}</span>
          ) : null}
          {shouldRenderClearButton ? (
            <button
              aria-label="입력값 지우기"
              className="inline-flex size-[20px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
              onClick={handleClear}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              {clearButtonContent}
            </button>
          ) : null}
        </div>
      </div>
    );
  },
);

Input.displayName = 'Input';
