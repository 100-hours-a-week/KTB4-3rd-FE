'use client';

import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  useCarpoolCreateStore,
  type CarpoolCreateLocation,
  type CarpoolLocationField,
} from '@/features/carpool-registration';
import {
  LocationSearchResultsSkeleton,
  useKakaoPlaceSearch,
  type LocationSearchResult,
} from '@/features/location-search';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';

import {
  getCarpoolLocationActionLabel,
  getCarpoolLocationLabel,
  parseCarpoolLocationField,
} from '../model/carpool-location-field'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

function toSearchResult(location: CarpoolCreateLocation | null, field: CarpoolLocationField) {
  if (!location) {
    return null;
  }

  return {
    id: `${field}-${location.lat}-${location.lng}`,
    latitude: location.lat,
    longitude: location.lng,
    placeName: location.name,
    distance: '',
    roadAddress: location.name,
  } satisfies LocationSearchResult;
}

function toCreateLocation(result: LocationSearchResult): CarpoolCreateLocation | null {
  const { latitude, longitude, placeName } = result;
  if (
    !placeName.trim() ||
    latitude === undefined ||
    longitude === undefined ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { name: placeName.trim(), lat: latitude, lng: longitude };
}

export function CarpoolLocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawField = searchParams.get('field');
  const field = parseCarpoolLocationField(rawField) ?? 'departure';
  const isValidField = parseCarpoolLocationField(rawField) !== null;
  const origin = useCarpoolCreateStore((state) => state.draft.origin);
  const destination = useCarpoolCreateStore((state) => state.draft.destination);
  const setOrigin = useCarpoolCreateStore((state) => state.setOrigin);
  const setDestination = useCarpoolCreateStore((state) => state.setDestination);
  const setPendingLocation = useCarpoolCreateStore((state) => state.setPendingLocation);
  const departure = toSearchResult(origin, 'departure');
  const selectedDestination = toSearchResult(destination, 'destination');
  const currentLocation = field === 'departure' ? departure : selectedDestination;
  const [activeField, setActiveField] = useState<CarpoolLocationField>(field);
  const [searchQuery, setSearchQuery] = useState(() => currentLocation?.placeName ?? '');
  const departureInputRef = useRef<ComponentRef<typeof Input>>(null);
  const destinationInputRef = useRef<ComponentRef<typeof Input>>(null);
  const kakaoSearch = useKakaoPlaceSearch(searchQuery);

  useEffect(() => {
    if (!isValidField) {
      router.replace('/carpools/new/location?field=departure');
    }
  }, [isValidField, router]);

  useEffect(() => {
    if (!isValidField) {
      return;
    }

    const input =
      activeField === 'departure' ? departureInputRef.current : destinationInputRef.current;
    input?.focus();
  }, [activeField, isValidField]);

  const getFieldValue = (target: CarpoolLocationField) => {
    if (activeField === target) {
      return searchQuery;
    }
    return target === 'departure'
      ? (departure?.placeName ?? '')
      : (selectedDestination?.placeName ?? '');
  };

  const handleFieldFocus = (target: CarpoolLocationField) => {
    setActiveField(target);
    const location = target === 'departure' ? departure : selectedDestination;
    setSearchQuery(location?.placeName ?? '');
    if (target !== field) {
      router.replace(`/carpools/new/location?field=${target}`);
    }
  };

  const saveLocation = (target: CarpoolLocationField, result: LocationSearchResult) => {
    const location = toCreateLocation(result);
    if (!location) {
      useSnackbarStore.getState().showSnackbar('위치 정보를 확인할 수 없어요.', 'critical');
      return false;
    }

    (target === 'departure' ? setOrigin : setDestination)(location);
    return true;
  };

  const handleDirectSelection = (result: LocationSearchResult) => {
    if (!saveLocation(activeField, result)) {
      return;
    }

    setPendingLocation(null);
    if (activeField === 'departure' && !destination) {
      setActiveField('destination');
      setSearchQuery('');
      router.replace('/carpools/new/location?field=destination');
      return;
    }

    router.push(activeField === 'destination' ? '/carpools/new/info' : '/carpools/new');
  };

  const handleDetailSelection = (result: LocationSearchResult) => {
    const location = toCreateLocation(result);
    if (!location) {
      useSnackbarStore.getState().showSnackbar('위치 정보를 확인할 수 없어요.', 'critical');
      return;
    }

    setPendingLocation({ field: activeField, location, roadAddress: result.roadAddress || null });
    router.push(`/carpools/new/location/adjust?field=${activeField}`);
  };

  if (!isValidField) {
    return null;
  }

  const shouldShowResults = searchQuery.trim().length > 0 || kakaoSearch.status !== 'idle';

  return (
    <div
      aria-label="카풀 장소 검색"
      className="mx-auto flex h-dvh min-h-0 w-full max-w-[393px] flex-col overflow-hidden bg-[var(--color-bg-layer-default)]"
    >
      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton className="absolute top-1.5 left-1.5" href="/carpools/new" />
      </header>
      <div aria-hidden="true" className="h-14 shrink-0" />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-2 px-5 pt-3">
          {(['departure', 'destination'] as const).map((target) => (
            <Input
              aria-label={getCarpoolLocationLabel(target)}
              className={cn(
                target === 'departure' &&
                  departure &&
                  '[&>div]:bg-[var(--color-bg-transparent-selected)]',
                target === 'destination' &&
                  selectedDestination &&
                  '[&>div]:bg-[var(--color-bg-transparent-selected)]',
              )}
              clearButton={false}
              inputClassName="text-[var(--font-size-t5)] leading-[var(--line-height-t5)] text-[var(--color-fg-neutral)] placeholder:text-[var(--color-fg-neutral-muted)]"
              key={target}
              placeholder={getCarpoolLocationLabel(target)}
              ref={target === 'departure' ? departureInputRef : destinationInputRef}
              value={getFieldValue(target)}
              onFocus={() => handleFieldFocus(target)}
              onValueChange={(value) => {
                setActiveField(target);
                setSearchQuery(value);
                if (target !== field) {
                  router.replace(`/carpools/new/location?field=${target}`);
                }
              }}
            />
          ))}
        </div>

        {shouldShowResults ? (
          <div
            aria-label="장소 검색 결과"
            className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
            role="list"
          >
            {kakaoSearch.status === 'loading' && !kakaoSearch.results.length ? (
              <LocationSearchResultsSkeleton />
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
              ? kakaoSearch.results.map((result) => (
                  <div className="flex flex-col" key={result.id} role="listitem">
                    <div className="flex h-[71px] w-full items-center gap-3.5 overflow-hidden bg-[var(--color-bg-layer-default)] px-5">
                      <button
                        aria-label={`${result.placeName}, ${result.roadAddress} 상세 위치 조정`}
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
                        aria-label={`${getCarpoolLocationActionLabel(activeField)} ${result.placeName}`}
                        className="!min-h-10 !min-w-10 !rounded-[8px] !px-4 !py-[10px]"
                        size="small"
                        type="button"
                        variant="neutral-outline"
                        onClick={() => handleDirectSelection(result)}
                      >
                        {getCarpoolLocationActionLabel(activeField)}
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
