'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  LocationSearchScreen,
  type LocationField,
  type LocationSearchResult,
  type LocationSelection,
} from '@/features/location-search';
import { usePostDraftStore } from '@/shared/model/stores/post-draft-store';

function getLocationField(value: string | null): LocationField {
  return value === 'destination' ? 'destination' : 'departure';
}

function toDraftLocation(placeName: string, field: LocationField): LocationSearchResult | null {
  if (!placeName) {
    return null;
  }

  return {
    id: `draft-${field}`,
    placeName,
    distance: '',
    roadAddress: '',
  };
}

export function PostWriteLocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = usePostDraftStore();
  const activeField = getLocationField(searchParams.get('field'));

  const handleComplete = ({ departure, destination }: LocationSelection) => {
    draft.setField('origin', departure.placeName);
    draft.setField('destination', destination.placeName);
    router.back();
  };

  return (
    <LocationSearchScreen
      initialActiveField={activeField}
      initialDeparture={toDraftLocation(draft.origin, 'departure')}
      initialDestination={
        activeField === 'departure' ? toDraftLocation(draft.destination, 'destination') : null
      }
      onCancel={() => router.back()}
      onComplete={handleComplete}
    />
  );
}
