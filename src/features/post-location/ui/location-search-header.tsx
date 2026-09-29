'use client';

import { useState } from 'react';

import { BackButton } from '@/shared/ui/back-button';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

export type LocationSearchHeaderResult = {
  distance: string;
  id: string;
  latitude?: number;
  longitude?: number;
  placeName: string;
  roadAddress: string;
};

export type LocationSearchHeaderProps = {
  backHref?: string;
  className?: string;
  defaultValue?: string;
  onResultSelect?: (result: LocationSearchHeaderResult) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  results?: readonly LocationSearchHeaderResult[];
  searchStatus?: 'idle' | 'loading' | 'success' | 'empty' | 'error';
};

const DEFAULT_PLACEHOLDER = '장소 · 주소를 검색해보세요';

export function LocationSearchHeader({
  backHref = '/',
  className,
  defaultValue = '',
  onResultSelect,
  onValueChange,
  placeholder = DEFAULT_PLACEHOLDER,
  results = [],
  searchStatus = 'idle',
}: LocationSearchHeaderProps) {
  const [value, setValue] = useState(defaultValue);
  const [isResultListOpen, setIsResultListOpen] = useState(false);

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
    setIsResultListOpen(nextValue.trim().length > 0);
    onValueChange?.(nextValue);
  };

  const handleResultSelect = (result: LocationSearchHeaderResult) => {
    setValue(result.placeName);
    setIsResultListOpen(false);
    onResultSelect?.(result);
  };

  const shouldShowResults = isResultListOpen && value.trim().length > 0;

  return (
    <div className={cn(className)} data-testid="location-search-header" role="search">
      <div className="relative">
        <Input
          aria-label="장소·주소 검색"
          className="w-full"
          disableFocusBorder
          inputClassName="text-[var(--font-size-t5)] leading-[var(--line-height-t5)] text-[var(--color-fg-neutral-muted)] placeholder:text-[var(--color-fg-neutral-muted)]"
          placeholder={placeholder}
          prefix={<BackButton href={backHref} />}
          value={value}
          onValueChange={handleValueChange}
        />

        {shouldShowResults ? (
          <div
            aria-label="장소 검색 결과"
            className="absolute top-[52px] right-0 left-0 z-10 max-h-[360px] overflow-y-auto rounded-[12px] bg-[var(--color-bg-layer-default)] shadow-[0_4px_16px_rgb(0_0_0_/_16%)]"
            role="list"
          >
            {searchStatus === 'loading' && !results.length ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색 중이에요.
                </Text>
              </p>
            ) : null}
            {searchStatus === 'empty' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  검색 결과가 없어요.
                </Text>
              </p>
            ) : null}
            {searchStatus === 'error' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색할 수 없어요.
                </Text>
              </p>
            ) : null}
            {searchStatus === 'success'
              ? results.map((result) => (
                  <div key={result.id} role="listitem">
                    <button
                      aria-label={`${result.placeName}${result.distance ? `, ${result.distance}` : ''}, ${result.roadAddress}`}
                      className="flex min-h-[71px] w-full items-center overflow-hidden px-5 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                      onClick={() => handleResultSelect(result)}
                      type="button"
                    >
                      <span className="flex w-full flex-col items-start justify-center">
                        <Text color="fg.neutral" variant="t5Regular">
                          {result.placeName}
                        </Text>
                        <Text color="fg.neutralMuted" variant="t1Regular">
                          {result.distance ? (
                            <>
                              {result.distance} <span aria-hidden="true">|</span>{' '}
                            </>
                          ) : null}
                          {result.roadAddress}
                        </Text>
                      </span>
                    </button>
                    <div
                      aria-hidden="true"
                      className="h-px w-full bg-[var(--color-stroke-neutral-subtle)]"
                    />
                  </div>
                ))
              : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
