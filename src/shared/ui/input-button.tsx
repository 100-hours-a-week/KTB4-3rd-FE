import { type BaseUIEvent } from '@base-ui/react';
import { Button as BaseButton } from '@base-ui/react/button';
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

type InputButtonOwnProps = {
  /** Content rendered before the selected value. */
  prefix?: ReactNode | null;
  /** Content rendered after the selected value. */
  suffix?: ReactNode | null;
  /** Optional clear-button content. Pass `true` to use the default icon. */
  clearButton?: ReactNode | null;
  /** Called when the selected value should be cleared. */
  onClear?: () => void;
  /** Text rendered when no value has been selected. */
  placeholder?: ReactNode;
  /** The selected value displayed by the button. */
  value?: ReactNode | null;
  /** Visual invalid state. `aria-invalid` is also recognized when provided. */
  invalid?: boolean;
  /** Prevents the picker trigger from opening while keeping the button focusable. */
  readOnly?: boolean;
  /** Class applied to the input-button surface. */
  className?: string;
};

export type InputButtonProps = Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'children' | 'className' | 'prefix' | 'suffix' | 'value'
> &
  InputButtonOwnProps;

function hasContent(content: ReactNode | null | undefined) {
  return content !== null && content !== undefined && content !== false && content !== '';
}

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

export const InputButton = forwardRef<ComponentRef<typeof BaseButton>, InputButtonProps>(
  (
    {
      'aria-invalid': ariaInvalid,
      'aria-readonly': ariaReadonly,
      className,
      clearButton,
      disabled = false,
      invalid,
      onClear,
      onClick,
      placeholder = '선택해 주세요',
      prefix,
      readOnly = false,
      suffix,
      type = 'button',
      value,
      ...props
    },
    ref,
  ) => {
    const buttonRef = useRef<ComponentRef<typeof BaseButton>>(null);
    const effectiveAriaInvalid = invalid === undefined ? ariaInvalid : invalid || undefined;
    const isInvalid = effectiveAriaInvalid === true || effectiveAriaInvalid === 'true';
    const hasValue = hasContent(value);
    const shouldRenderClearButton =
      hasClearButton(clearButton) && hasValue && !disabled && !readOnly;
    const clearButtonContent = getClearButtonContent(clearButton);

    useImperativeHandle(ref, () => buttonRef.current as ComponentRef<typeof BaseButton>);

    function handleClick(event: BaseUIEvent<MouseEvent<HTMLButtonElement>>) {
      if (readOnly) {
        event.preventDefault();
        return;
      }

      onClick?.(event);
    }

    function handleClear() {
      onClear?.();
      buttonRef.current?.focus();
    }

    return (
      <div className={cn('relative flex w-full items-start', className)}>
        <div
          className={cn(
            'flex h-[var(--dimension-x13)] w-full items-center overflow-hidden rounded-[12px] border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)] transition-colors',
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
          <BaseButton
            {...props}
            ref={buttonRef}
            aria-invalid={effectiveAriaInvalid}
            aria-readonly={readOnly ? true : ariaReadonly}
            className={cn(
              'group flex h-full min-w-0 flex-1 items-center gap-[var(--dimension-x2)] overflow-hidden border-0 bg-transparent px-[var(--dimension-x4)] text-left text-[var(--font-size-t4)] leading-[var(--line-height-t4)] font-normal text-[var(--color-fg-neutral)] outline-none transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]',
              'active:bg-[var(--color-bg-transparent-pressed)] data-[pressed]:bg-[var(--color-bg-transparent-pressed)]',
              'data-[invalid=true]:text-[var(--color-fg-neutral)]',
              'data-[readonly=true]:cursor-default',
              'disabled:cursor-not-allowed disabled:text-[var(--color-fg-disabled)]',
            )}
            data-invalid={isInvalid ? 'true' : undefined}
            data-readonly={readOnly ? 'true' : undefined}
            disabled={disabled}
            onClick={handleClick}
            type={type}
          >
            {prefix !== null && prefix !== undefined ? (
              <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
                {prefix}
              </span>
            ) : null}
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                hasValue ? 'text-[var(--color-fg-neutral)]' : 'text-[var(--color-fg-placeholder)]',
                'group-disabled:text-[var(--color-fg-disabled)]',
              )}
            >
              {hasValue ? value : placeholder}
            </span>
            {suffix !== null && suffix !== undefined ? (
              <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
                {suffix}
              </span>
            ) : null}
          </BaseButton>

          {shouldRenderClearButton ? (
            <button
              aria-label="입력값 지우기"
              className="mr-[var(--dimension-x4)] inline-flex size-[var(--dimension-x5)] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
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

InputButton.displayName = 'InputButton';
