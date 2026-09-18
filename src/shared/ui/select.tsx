import { Select as BaseSelect } from '@base-ui/react/select';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type SelectOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  description?: ReactNode | null;
  prefixIcon?: ReactNode | null;
  disabled?: boolean;
};

export type SelectProps<T extends string = string> = {
  options: SelectOption<T>[];
  value: T | null;
  onValueChange: (value: T | null) => void;
  placeholder?: ReactNode;
  prefixIcon?: ReactNode | null;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  name?: string;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  className?: string;
};

function hasOption<T extends string>(options: SelectOption<T>[], value: T | null) {
  return value !== null && options.some((option) => option.value === value);
}

export function Select<T extends string = string>({
  options,
  value,
  onValueChange,
  placeholder = '선택해 주세요',
  prefixIcon,
  disabled = false,
  readOnly = false,
  invalid = false,
  name,
  required = false,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: SelectProps<T>) {
  const normalizedValue = hasOption(options, value) ? value : null;
  const selectedOption = options.find((option) => option.value === normalizedValue);
  const triggerPrefixIcon = selectedOption?.prefixIcon ?? prefixIcon;

  return (
    <div className={cn('w-full', className)}>
      <BaseSelect.Root<T>
        disabled={disabled}
        id={id}
        items={options}
        name={name}
        onValueChange={(nextValue) => onValueChange(nextValue)}
        readOnly={readOnly}
        required={required}
        value={normalizedValue}
      >
        <BaseSelect.Trigger
          className={cn(
            'group flex h-[var(--dimension-x13)] w-full items-center justify-between gap-[var(--dimension-x2_5)] rounded-[12px] border border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-transparent)] px-[var(--dimension-x4)] text-left text-[var(--font-size-t5)] leading-[var(--line-height-t5)] font-normal text-[var(--color-fg-neutral)] outline-none transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
            'active:bg-[var(--color-bg-transparent-pressed)] data-[pressed]:bg-[var(--color-bg-transparent-pressed)]',
            'data-[popup-open]:border-2 data-[popup-open]:border-[var(--color-stroke-neutral-contrast)]',
            'data-[invalid=true]:border-2 data-[invalid=true]:border-[var(--color-stroke-critical-solid)]',
            'data-[invalid=true]:data-[popup-open]:border-[var(--color-stroke-critical-solid)]',
            'data-[readonly=true]:bg-[var(--color-bg-disabled)] data-[readonly=true]:focus-visible:border-[var(--color-stroke-neutral-weak)]',
            'disabled:cursor-not-allowed disabled:border-[var(--color-stroke-neutral-weak)] disabled:bg-[var(--color-bg-disabled)] disabled:text-[var(--color-fg-disabled)]',
          )}
          aria-describedby={ariaDescribedBy}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          data-invalid={invalid ? 'true' : undefined}
          data-readonly={readOnly ? 'true' : undefined}
        >
          {triggerPrefixIcon !== null && triggerPrefixIcon !== undefined ? (
            <span
              aria-hidden="true"
              className="inline-flex size-[var(--dimension-x5)] shrink-0 items-center justify-center"
            >
              {triggerPrefixIcon}
            </span>
          ) : null}
          <BaseSelect.Value
            className="min-w-0 flex-1 truncate data-[placeholder]:text-[var(--color-fg-placeholder)] group-disabled:data-[placeholder]:text-[var(--color-fg-disabled)]"
            placeholder={placeholder}
          />
          <BaseSelect.Icon
            className={cn(
              'inline-flex shrink-0 items-center justify-center text-[var(--color-fg-neutral-muted)] transition-transform group-disabled:text-[var(--color-fg-disabled)] group-data-[popup-open]:rotate-180',
              'size-[var(--dimension-x5)]',
            )}
          >
            <Icon aria-hidden="true" name="chevronDown" size="100%" />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            align="start"
            className="z-50 w-[var(--anchor-width)] min-w-[180px] outline-none"
            collisionPadding={8}
            collisionAvoidance={{ side: 'shift', align: 'shift', fallbackAxisSide: 'none' }}
            sideOffset={8}
            side="bottom"
          >
            <BaseSelect.Popup
              className={cn(
                'flex max-h-[min(480px,var(--available-height))] flex-col gap-[var(--dimension-x2)] overflow-y-auto rounded-[12px] bg-[var(--color-bg-layer-floating)] px-[var(--dimension-x1)] py-[var(--dimension-x2)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] outline-none',
                'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
                'origin-[var(--transform-origin)] transition-[transform,opacity] duration-150',
              )}
            >
              {options.length > 0 ? (
                options.map((option) => (
                  <BaseSelect.Item
                    className={cn(
                      'group relative flex w-full cursor-pointer items-center rounded-[12px] px-[var(--dimension-x4)] outline-none',
                      'gap-[var(--dimension-x3)] py-[var(--dimension-x3)] text-[var(--font-size-t5)] leading-[var(--line-height-t5)]',
                      'active:bg-[var(--color-bg-transparent-pressed)] data-[pressed]:bg-[var(--color-bg-transparent-pressed)]',
                      'data-[highlighted]:bg-[var(--color-bg-neutral-weak)]',
                      'data-[disabled]:pointer-events-none data-[disabled]:text-[var(--color-fg-disabled)]',
                    )}
                    disabled={option.disabled}
                    key={option.value}
                    value={option.value}
                  >
                    {option.prefixIcon !== null && option.prefixIcon !== undefined ? (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'inline-flex shrink-0 items-center justify-center text-[var(--color-fg-neutral)] group-data-[disabled]:text-[var(--color-fg-disabled)]',
                          'size-[22px]',
                        )}
                      >
                        {option.prefixIcon}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-1 flex-col gap-[var(--dimension-x0_5)]">
                      <BaseSelect.ItemText className="font-normal break-words text-[var(--color-fg-neutral)] group-data-[disabled]:text-[var(--color-fg-disabled)]">
                        {option.label}
                      </BaseSelect.ItemText>
                      {option.description !== null && option.description !== undefined ? (
                        <span
                          className={cn(
                            'break-words font-normal text-[var(--color-fg-neutral-subtle)] group-data-[disabled]:text-[var(--color-fg-disabled)]',
                            'text-[var(--font-size-t3)] leading-[var(--line-height-t3)]',
                          )}
                        >
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    <BaseSelect.ItemIndicator
                      className={cn(
                        'inline-flex shrink-0 items-center justify-center text-[var(--color-fg-neutral)] group-data-[disabled]:text-[var(--color-fg-disabled)]',
                        'size-[var(--dimension-x3_5)]',
                      )}
                    >
                      <Icon aria-hidden="true" name="checkmark" size="100%" />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))
              ) : (
                <div
                  className="px-[var(--dimension-x3)] py-[var(--dimension-x3)] leading-[var(--line-height-t4)] text-[var(--color-fg-neutral-muted)] text-[var(--font-size-t4)]"
                  role="status"
                >
                  선택 가능한 항목이 없습니다
                </div>
              )}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
