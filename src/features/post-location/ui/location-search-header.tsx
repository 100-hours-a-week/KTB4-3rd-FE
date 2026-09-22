'use client';

import { useState } from 'react';

import { BackButton } from '@/shared/ui/back-button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';

export type LocationSearchHeaderProps = {
  backHref?: string;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

const DEFAULT_PLACEHOLDER = '장소 · 주소를 검색해보세요';

export function LocationSearchHeader({
  backHref = '/',
  className,
  defaultValue = '',
  onValueChange,
  placeholder = DEFAULT_PLACEHOLDER,
}: LocationSearchHeaderProps) {
  const [value, setValue] = useState(defaultValue);

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <div
      className={cn('relative w-full', className)}
      data-testid="location-search-header"
      role="search"
    >
      <Input
        aria-label="장소·주소 검색"
        className="w-full"
        inputClassName="text-[var(--font-size-t5)] leading-[var(--line-height-t5)] text-[var(--color-fg-neutral-muted)] placeholder:text-[var(--color-fg-neutral-muted)]"
        placeholder={placeholder}
        prefix={<BackButton href={backHref} />}
        value={value}
        onValueChange={handleValueChange}
      />
    </div>
  );
}
