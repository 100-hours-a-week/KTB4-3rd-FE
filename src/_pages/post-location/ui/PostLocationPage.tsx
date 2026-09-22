'use client';

import { useState } from 'react';

import { getMapPinMarkerImage } from '@/entities/map-pin';
import { LocationSearchHeader, LocationSelectionFooter } from '@/features/post-location';
import type { MapCoordinate } from '@/shared/types/common';
import { Map } from '@/shared/ui/map';

const companionMarker = getMapPinMarkerImage('accompany');

export type PostLocationPageProps = {
  onLocationRegister?: (coordinate: MapCoordinate) => void;
};

export function PostLocationPage({ onLocationRegister }: PostLocationPageProps) {
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate | null>(null);

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
          onCenterChange={setSelectedCoordinate}
          selectionMode
          selectionMarker={companionMarker}
          showCurrentLocationButton={false}
          showZoomControls={false}
        />

        <LocationSearchHeader className="absolute top-5 right-5 left-5 z-20" />
      </main>

      <LocationSelectionFooter
        className="absolute right-0 bottom-0 left-0 z-20"
        onRegister={handleRegister}
      />
    </div>
  );
}
