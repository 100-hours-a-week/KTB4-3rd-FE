'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';

import {
  defaultLocationSearchResults,
  useKakaoPlaceSearch,
  type LocationSearchResult,
} from '@/features/location-search';
import { useMatchingStore } from '@/_pages/matching/model/matching-store';
import {
  getMatchingLocationActionLabel,
  getMatchingLocationLabel,
  type MatchingLocationField,
} from '@/_pages/matching/model/matching-location-field';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';

function getLocationField(value: string | null): MatchingLocationField {
  return value === 'destination' ? 'destination' : 'departure';
}

function getSearchResultLabel(result: LocationSearchResult) {
  return `${result.placeName}${result.distance ? `, ${result.distance}` : ''}, ${result.roadAddress}`;
}

export function MatchingLocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialField = getLocationField(searchParams.get('field'));
  const departure = useMatchingStore((state) => state.departure);
  const destination = useMatchingStore((state) => state.destination);
  const setLocation = useMatchingStore((state) => state.setLocation);
  const setPendingLocation = useMatchingStore((state) => state.setPendingLocation);
  const [activeField, setActiveField] = useState<MatchingLocationField>(initialField);
  const [searchQuery, setSearchQuery] = useState(() =>
    initialField === 'departure' ? (departure?.placeName ?? '') : (destination?.placeName ?? ''),
  );
  const departureInputRef = useRef<ComponentRef<typeof Input>>(null);
  const destinationInputRef = useRef<ComponentRef<typeof Input>>(null);
  const kakaoSearch = useKakaoPlaceSearch(searchQuery);

  useEffect(() => {
    const input =
      activeField === 'departure' ? departureInputRef.current : destinationInputRef.current;

    input?.focus();
  }, [activeField]);

  const searchResults = useMemo(
    () =>
      searchQuery.trim() || kakaoSearch.status !== 'idle'
        ? kakaoSearch.results
        : defaultLocationSearchResults,
    [kakaoSearch.results, kakaoSearch.status, searchQuery],
  );
  const shouldShowResults = searchResults.length > 0 || kakaoSearch.status !== 'idle';
  const showResultLabel = departure === null && destination === null;

  const getFieldValue = (field: MatchingLocationField) => {
    if (field === activeField) {
      return searchQuery;
    }

    return field === 'departure' ? (departure?.placeName ?? '') : (destination?.placeName ?? '');
  };

  const handleFieldFocus = (field: MatchingLocationField) => {
    setActiveField(field);
    setSearchQuery(
      field === 'departure' ? (departure?.placeName ?? '') : (destination?.placeName ?? ''),
    );
  };

  const handleFieldChange = (field: MatchingLocationField, value: string) => {
    setActiveField(field);
    setSearchQuery(value);
  };

  const handleDirectSelection = (result: LocationSearchResult) => {
    setLocation(activeField, result);

    if (activeField === 'departure' && destination === null) {
      setActiveField('destination');
      setSearchQuery('');
      return;
    }

    router.push('/matching');
  };

  const handleDetailSelection = (result: LocationSearchResult) => {
    setPendingLocation(result);
    router.push(`/matching/location/adjust?field=${activeField}`);
  };

  return (
    <div
      aria-label="장소 검색"
      className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[var(--color-bg-layer-default)]"
    >
      <header className="relative h-14 shrink-0">
        <BackButton className="absolute top-1.5 left-1.5" href="/matching" />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-2 px-5 pt-3">
          {(['departure', 'destination'] as const).map((field) => (
            <Input
              aria-label={getMatchingLocationLabel(field)}
              className={cn(
                field === 'departure' &&
                  departure &&
                  '[&>div]:bg-[var(--color-bg-transparent-selected)]',
                field === 'destination' &&
                  destination &&
                  '[&>div]:bg-[var(--color-bg-transparent-selected)]',
              )}
              clearButton={false}
              inputClassName="text-[var(--font-size-t5)] leading-[var(--line-height-t5)] text-[var(--color-fg-neutral)] placeholder:text-[var(--color-fg-neutral-muted)]"
              key={field}
              placeholder={getMatchingLocationLabel(field)}
              ref={field === 'departure' ? departureInputRef : destinationInputRef}
              value={getFieldValue(field)}
              onFocus={() => handleFieldFocus(field)}
              onValueChange={(value) => handleFieldChange(field, value)}
            />
          ))}
        </div>

        {showResultLabel ? (
          <Text className="mt-8 px-5" color="fg.neutralSubtle" variant="t4Regular">
            장소결과
          </Text>
        ) : null}

        {shouldShowResults ? (
          <div
            aria-label="장소 검색 결과"
            className={cn('mt-3 flex flex-col', !showResultLabel && 'mt-3')}
            role="list"
          >
            {kakaoSearch.status === 'loading' &&
            searchQuery.trim() &&
            !kakaoSearch.results.length ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색 중이에요.
                </Text>
              </p>
            ) : null}
            {kakaoSearch.status === 'empty' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  검색 결과가 없어요.
                </Text>
              </p>
            ) : null}
            {kakaoSearch.status === 'error' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색할 수 없어요.
                </Text>
              </p>
            ) : null}
            {kakaoSearch.status !== 'loading' &&
            kakaoSearch.status !== 'error' &&
            kakaoSearch.status !== 'empty'
              ? searchResults.map((result) => (
                  <div className="flex flex-col" key={result.id} role="listitem">
                    <div className="flex h-[71px] w-full items-center gap-3.5 overflow-hidden bg-[var(--color-bg-layer-default)] px-5">
                      <button
                        aria-label={`${getSearchResultLabel(result)} 상세 위치 조정`}
                        className="flex min-w-0 flex-1 flex-col items-start justify-center text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
                        type="button"
                        onClick={() => handleDetailSelection(result)}
                      >
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
                      </button>
                      <Button
                        aria-label={`${getMatchingLocationActionLabel(activeField)} ${result.placeName}`}
                        className="!min-h-10 !min-w-10 !rounded-[8px] !px-4 !py-[10px]"
                        size="small"
                        type="button"
                        variant="neutral-outline"
                        onClick={() => handleDirectSelection(result)}
                      >
                        {getMatchingLocationActionLabel(activeField)}
                      </Button>
                    </div>
                    <div
                      aria-hidden="true"
                      className="h-px w-full bg-[var(--color-stroke-neutral-subtle)]"
                    />
                  </div>
                ))
              : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
