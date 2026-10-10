import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

import type { CarpoolRequestDirection } from '@/entities/carpool/model/carpool-request';

export type CarpoolRequestTabsProps = {
  value: CarpoolRequestDirection;
  disabled?: boolean;
  onValueChange: (value: CarpoolRequestDirection) => void;
  className?: string;
};

const options: { value: CarpoolRequestDirection; label: string }[] = [
  { value: 'SENT', label: '보낸 요청' },
  { value: 'RECEIVED', label: '받은 요청' },
];

export function CarpoolRequestTabs({
  value,
  disabled = false,
  onValueChange,
  className,
}: CarpoolRequestTabsProps) {
  return (
    <div
      aria-label="카풀 요청 방향"
      className={cn('flex items-center gap-2', className)}
      role="tablist"
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            aria-selected={selected}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded-full border px-3 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
              selected
                ? 'border-transparent bg-[var(--color-bg-brand-solid)]'
                : 'border-[var(--color-stroke-neutral-weak)] bg-[var(--color-bg-layer-default)]',
            )}
            disabled={disabled}
            key={option.value}
            onClick={() => {
              if (!selected) {
                onValueChange(option.value);
              }
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            <Text
              as="span"
              color={selected ? 'fg.neutralInverted' : 'fg.neutral'}
              variant="t3Regular"
              whiteSpace="nowrap"
            >
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
