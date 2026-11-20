'use client';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type ChipTabOption<Value extends string = string> = {
  label: string;
  value: Value;
  widthClassName?: string;
};

export type ChipTabsProps<Value extends string = string> = {
  ariaLabel: string;
  className?: string;
  onValueChange: (value: Value) => void;
  options: readonly ChipTabOption<Value>[];
  value: Value;
};

export function ChipTabs<Value extends string>({
  ariaLabel,
  className,
  onValueChange,
  options,
  value,
}: ChipTabsProps<Value>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn('flex items-start gap-[var(--spacing-x-between-chips)]', className)}
      role="tablist"
    >
      {options.map(({ label, value: optionValue, widthClassName }) => {
        const isSelected = value === optionValue;

        return (
          <button
            aria-selected={isSelected}
            className={cn(
              'inline-flex h-[var(--dimension-x8)] shrink-0 cursor-pointer items-center justify-center overflow-clip rounded-full border px-[var(--dimension-x3_5)] py-[7px] outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
              widthClassName,
              isSelected
                ? 'border-transparent bg-[var(--color-bg-brand-solid)]'
                : 'border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)] hover:bg-[var(--color-bg-layer-default-pressed)] active:bg-[var(--color-bg-layer-default-pressed)]',
            )}
            key={optionValue}
            onClick={() => onValueChange(optionValue)}
            role="tab"
            tabIndex={isSelected ? 0 : -1}
            type="button"
          >
            <Text
              as="span"
              color={isSelected ? 'fg.neutralInverted' : 'fg.neutral'}
              variant="t3Regular"
              whiteSpace="nowrap"
            >
              {label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
