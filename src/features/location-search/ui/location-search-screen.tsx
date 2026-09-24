'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';

import {
  type LocationSearchResult,
  type LocationSelection,
} from '@/features/location-search/model/location';
import { useKakaoPlaceSearch } from '@/features/location-search/model/use-kakao-place-search';

type LocationField = 'departure' | 'destination';

export type LocationSearchScreenProps = {
  className?: string;
  initialDeparture?: LocationSearchResult | null;
  initialDestination?: LocationSearchResult | null;
  onCancel?: () => void;
  onComplete?: (selection: LocationSelection) => void;
  results?: LocationSearchResult[];
};

function getFieldLabel(field: LocationField) {
  return field === 'departure' ? '출발지' : '도착지';
}

function matchesSearchResult(result: LocationSearchResult, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [result.placeName, result.roadAddress].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function LocationSearchScreen({
  className,
  initialDeparture = null,
  initialDestination = null,
  onCancel,
  onComplete,
  results,
}: LocationSearchScreenProps) {
  const [departure, setDeparture] = useState<LocationSearchResult | null>(initialDeparture);
  const [destination, setDestination] = useState<LocationSearchResult | null>(initialDestination);
  const [activeField, setActiveField] = useState<LocationField>(
    initialDeparture ? 'destination' : 'departure',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const kakaoSearch = useKakaoPlaceSearch(searchQuery, { enabled: results === undefined });

  const shouldShowResults =
    searchQuery.trim().length > 0 ||
    (results !== undefined && activeField === 'destination' && !!departure);
  const searchResults = results ?? kakaoSearch.results;
  const visibleResults = useMemo(
    () =>
      results === undefined
        ? searchResults
        : searchResults.filter((result) => matchesSearchResult(result, searchQuery)),
    [results, searchQuery, searchResults],
  );

  const getFieldValue = (field: LocationField) => {
    const selectedLocation = field === 'departure' ? departure : destination;

    return activeField === field ? searchQuery : (selectedLocation?.placeName ?? '');
  };

  const handleFieldFocus = (field: LocationField) => {
    const selectedLocation = field === 'departure' ? departure : destination;

    setActiveField(field);
    setSearchQuery(selectedLocation?.placeName ?? '');
  };

  const handleFieldChange = (field: LocationField, value: string) => {
    setActiveField(field);
    setSearchQuery(value);
  };

  const handleResultSelect = (result: LocationSearchResult) => {
    setSearchQuery('');

    if (activeField === 'departure') {
      setDeparture(result);

      if (destination) {
        onComplete?.({ departure: result, destination });
        return;
      }

      setActiveField('destination');
      return;
    }

    setDestination(result);

    if (departure) {
      onComplete?.({ departure, destination: result });
      return;
    }

    setActiveField('departure');
  };

  return (
    <div
      aria-label="장소 검색"
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[var(--color-bg-layer-default)]',
        className,
      )}
    >
      <header className="flex h-[var(--dimension-x14)] shrink-0 items-center px-[var(--dimension-x1_5)]">
        <button
          aria-label="장소 검색 닫기"
          className="inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
          onClick={onCancel}
          type="button"
        >
          <Icon aria-hidden="true" name="chevronLeft" size={24} />
        </button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-2 px-5 pt-3">
          {(['departure', 'destination'] as const).map((field) => (
            <Input
              aria-label={getFieldLabel(field)}
              className={cn(
                field === 'departure' &&
                  departure &&
                  '[&>div]:bg-[var(--color-bg-transparent-selected)]',
              )}
              inputClassName="text-[var(--font-size-t5)] leading-[var(--line-height-t5)] text-[var(--color-fg-neutral)] placeholder:text-[var(--color-fg-neutral-muted)]"
              key={field}
              placeholder={getFieldLabel(field)}
              value={getFieldValue(field)}
              onFocus={() => handleFieldFocus(field)}
              onValueChange={(value) => handleFieldChange(field, value)}
            />
          ))}
        </div>

        {shouldShowResults ? (
          <div aria-label="장소 검색 결과" className="mt-3 flex flex-col" role="list">
            {results === undefined &&
            kakaoSearch.status === 'loading' &&
            !kakaoSearch.results.length ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색 중이에요.
                </Text>
              </p>
            ) : null}
            {results === undefined && kakaoSearch.status === 'empty' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  검색 결과가 없어요.
                </Text>
              </p>
            ) : null}
            {results === undefined && kakaoSearch.status === 'error' ? (
              <p aria-live="polite" className="px-5 py-4" role="status">
                <Text color="fg.neutralMuted" variant="t1Regular">
                  장소를 검색할 수 없어요.
                </Text>
              </p>
            ) : null}
            {results !== undefined || kakaoSearch.status === 'success'
              ? visibleResults.map((result) => (
                  <div key={result.id} role="listitem">
                    <button
                      aria-label={`${result.placeName}${result.distance ? `, ${result.distance}` : ''}, ${result.roadAddress}`}
                      className="flex h-[71px] w-full items-center overflow-hidden bg-[var(--color-bg-layer-default)] px-5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)]"
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
      </main>
    </div>
  );
}
