'use client';

import { useState } from 'react';

import { LocationInputButton } from '@/shared/ui/location-input-button';

import {
  defaultLocationSearchResults,
  type LocationSearchResult,
  type LocationSelection,
} from '@/features/location-search/model/location';

import { LocationSearchScreen } from './location-search-screen';

export type LocationInputButtonFlowProps = {
  initialSelection?: LocationSelection | null;
  onComplete?: (selection: LocationSelection) => void;
  results?: LocationSearchResult[];
};

export function LocationInputButtonFlow({
  initialSelection = null,
  onComplete,
  results = defaultLocationSearchResults,
}: LocationInputButtonFlowProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selection, setSelection] = useState<LocationSelection | null>(initialSelection);

  if (isSearchOpen) {
    return (
      <LocationSearchScreen
        initialDeparture={selection?.departure}
        initialDestination={selection?.destination}
        onCancel={() => setIsSearchOpen(false)}
        onComplete={(nextSelection) => {
          setSelection(nextSelection);
          setIsSearchOpen(false);
          onComplete?.(nextSelection);
        }}
        results={results}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[393px] items-start bg-[var(--color-bg-layer-default)] p-5">
      <LocationInputButton
        aria-label="장소 선택"
        clearButton
        placeholder="장소를 선택해 주세요"
        value={selection?.destination.placeName ?? null}
        onClear={() => setSelection(null)}
        onClick={() => setIsSearchOpen(true)}
      />
    </div>
  );
}
