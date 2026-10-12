'use client';

import { useState } from 'react';

import { ChipTabs, type ChipTabOption } from '@/shared/ui/chip-tabs';

export const chatListTabValues = ['matching', 'community'] as const;
export type ChatListTabValue = (typeof chatListTabValues)[number];

const CHAT_LIST_TAB_OPTIONS: readonly ChipTabOption<ChatListTabValue>[] = [
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
    <ChipTabs
      ariaLabel="채팅 목록 필터"
      className={className}
      onValueChange={handleTabClick}
      options={CHAT_LIST_TAB_OPTIONS}
      value={selectedValue}
    />
  );
}
