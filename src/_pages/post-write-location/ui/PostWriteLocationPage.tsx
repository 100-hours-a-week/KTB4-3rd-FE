'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  LocationSearchScreen,
  type LocationField,
  type LocationSearchResult,
  type LocationSelection,
} from '@/features/location-search';
import { usePostCreateStore, type PostCreateLocation } from '@/features/post-create';

function getLocationField(value: string | null): LocationField {
  return value === 'destination' ? 'destination' : 'departure';
}

function toSearchLocation(
  location: PostCreateLocation | null,
  field: LocationField,
): LocationSearchResult | null {
  if (!location) {
    return null;
  }

  return {
    id: `draft-${field}`,
    latitude: location.lat ?? undefined,
    longitude: location.lng ?? undefined,
    placeName: location.name,
    distance: '',
    roadAddress: '',
  };
}

export function PostWriteLocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draft = usePostCreateStore();
  const activeField = getLocationField(searchParams.get('field'));

  const handleComplete = ({ departure, destination }: LocationSelection) => {
    draft.setCompanionLocation('origin', {
      name: departure.placeName,
      lat: departure.latitude ?? null,
      lng: departure.longitude ?? null,
    });
    draft.setCompanionLocation('destination', {
      name: destination.placeName,
      lat: destination.latitude ?? null,
      lng: destination.longitude ?? null,
    });
    router.back();
  };

  return (
    <LocationSearchScreen
      initialActiveField={activeField}
      initialDeparture={toSearchLocation(draft.companion.origin, 'departure')}
      initialDestination={
        activeField === 'departure'
          ? toSearchLocation(draft.companion.destination, 'destination')
          : null
      }
      onCancel={() => router.back()}
      onComplete={handleComplete}
    />
  );
}
