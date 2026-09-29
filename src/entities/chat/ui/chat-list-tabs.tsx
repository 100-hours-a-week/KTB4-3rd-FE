'use client';

import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export const chatListTabValues = ['matching', 'community'] as const;
export type ChatListTabValue = (typeof chatListTabValues)[number];

type ChatListTabOption = {
  label: string;
  value: ChatListTabValue;
  widthClassName: string;
};

const CHAT_LIST_TAB_OPTIONS: readonly ChatListTabOption[] = [
  { label: '매칭', value: 'matching', widthClassName: 'w-[68px]' },
  { label: '커뮤니티', value: 'community', widthClassName: 'w-[80px]' },
];

export type ChatListTabsProps = {
  className?: string;
  defaultValue?: ChatListTabValue;
  onValueChange?: (value: ChatListTabValue) => void;
  value?: ChatListTabValue;
};

export function ChatListTabs({
  className,
  defaultValue = 'community',
  onValueChange,
  value,
}: ChatListTabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;

  const handleTabClick = (nextValue: ChatListTabValue) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  return (
    <div
      aria-label="채팅 목록 필터"
      className={cn('flex items-start gap-[var(--spacing-x-between-chips)]', className)}
      role="tablist"
    >
      {CHAT_LIST_TAB_OPTIONS.map(({ label, value: tabValue, widthClassName }) => {
        const isSelected = selectedValue === tabValue;

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
            key={tabValue}
            onClick={() => handleTabClick(tabValue)}
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
