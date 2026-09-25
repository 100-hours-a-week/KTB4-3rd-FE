'use client';

import { useEffect, useState } from 'react';

import { getMapPinMarkerImage } from '@/entities/map-pin';
import {
  LocationSearchHeader,
  LocationSelectionFooter,
  reverseGeocodeLocation,
  type ReverseGeocodedLocation,
} from '@/features/post-location';
import type { MapCoordinate } from '@/shared/types/common';
import { Map } from '@/shared/ui/map';

const companionMarker = getMapPinMarkerImage('accompany');

export type PostLocationPageProps = {
  onLocationRegister?: (coordinate: MapCoordinate) => void;
};

export function PostLocationPage({ onLocationRegister }: PostLocationPageProps) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | null>(null);
  const [locationDetails, setLocationDetails] = useState<ReverseGeocodedLocation | null>(null);

  const handleCenterChange = (center: MapCoordinate) => {
    setSelectedCoordinate(center);
    setLocationDetails(null);
  };

  useEffect(() => {
    if (!selectedCoordinate) {
      return;
    }

    let cancelled = false;

    reverseGeocodeLocation(selectedCoordinate)
      .then((details) => {
        if (!cancelled) {
          setLocationDetails(details);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationDetails(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCoordinate]);

  const handleRegister = () => {
    if (selectedCoordinate) {
      onLocationRegister?.(selectedCoordinate);
    }
  };

  return (
    <div className="relative mx-auto h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
      <main className="relative h-full" aria-label="글 등록 장소 선택">
        <Map
          className="absolute inset-0 h-full"
          clusterMarkers={false}
          onCenterChange={handleCenterChange}
          selectionMode
          selectionMarker={companionMarker}
          showCurrentLocationButton={false}
          showZoomControls={false}
        />

        <LocationSearchHeader className="absolute top-5 right-5 left-5 z-20" />
      </main>

      <LocationSelectionFooter
        className="absolute right-0 bottom-0 left-0 z-20"
        placeName={locationDetails ? (locationDetails.placeName ?? '건물명 정보 없음') : ''}
        roadAddress={locationDetails ? (locationDetails.roadAddress ?? '도로명주소 정보 없음') : ''}
        onRegister={handleRegister}
      />
    </div>
  );
}
