import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

import type { ChatCarpoolTab } from '@/entities/carpool/model/carpool-request';

export type ChatCarpoolTabsProps = {
  value: ChatCarpoolTab;
  disabled?: boolean;
  onValueChange: (value: ChatCarpoolTab) => void;
  className?: string;
};

const options: { value: ChatCarpoolTab; label: string }[] = [
  { value: 'chat', label: '채팅' },
  { value: 'carpool', label: '카풀' },
];

export function ChatCarpoolTabs({
  value,
  disabled = false,
  onValueChange,
  className,
}: ChatCarpoolTabsProps) {
  const selectNextTab = (current: ChatCarpoolTab, direction: 1 | -1) => {
    const index = options.findIndex((option) => option.value === current);
    const next = options[(index + direction + options.length) % options.length];
    document.getElementById(`chat-carpool-tab-${next.value}`)?.focus();
  };

  return (
    <div
      aria-label="채팅 화면"
      className={cn('flex w-full border-b border-[var(--color-stroke-neutral-subtle)]', className)}
      role="tablist"
    >
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            aria-selected={selected}
            className={cn(
              'relative flex h-[56px] flex-1 items-center justify-center border-0 bg-transparent px-4 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50',
              selected &&
                'after:absolute after:right-0 after:bottom-[-1px] after:left-0 after:h-1 after:bg-[var(--color-bg-brand-solid)]',
            )}
            disabled={disabled}
            id={`chat-carpool-tab-${option.value}`}
            key={option.value}
            onClick={() => {
              if (!selected) {
                onValueChange(option.value);
              }
            }}
            onKeyDown={(event) => {
              if (disabled) {
                return;
              }
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                selectNextTab(option.value, event.key === 'ArrowRight' ? 1 : -1);
              }
            }}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            <Text as="span" color="fg.neutral" variant={selected ? 't1Bold' : 't1Regular'}>
              {option.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
