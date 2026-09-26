'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { DestinationPin, StartPin } from '@/entities/map-pin';
import type { LocationSearchResult } from '@/features/location-search';
import { reverseGeocodeLocation } from '@/features/post-location';
import { SEOUL_STATION_COORDINATE, useMatchingStore } from '@/_pages/matching/model/matching-store';
import {
  getMatchingLocationLabel,
  getMatchingLocationPanelActionLabel,
  type MatchingLocationField,
} from '@/_pages/matching/model/matching-location-field';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { Map, MyLocationButton, type MapRef } from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';
import { Text } from '@/shared/ui/text';

function getLocationField(value: string | null): MatchingLocationField {
  return value === 'destination' ? 'destination' : 'departure';
}

export function MatchingLocationAdjustPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const field = getLocationField(searchParams.get('field'));
  const mapRef = useRef<MapRef>(null);
  const isConfirmingRef = useRef(false);
  const pendingLocation = useMatchingStore((state) => state.pendingLocation);
  const setLocation = useMatchingStore((state) => state.setLocation);
  const setPendingLocation = useMatchingStore((state) => state.setPendingLocation);
  const [center, setCenter] = useState<MapCoordinate>(() => ({
    lat: pendingLocation?.latitude ?? SEOUL_STATION_COORDINATE.lat,
    lng: pendingLocation?.longitude ?? SEOUL_STATION_COORDINATE.lng,
  }));
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(
    pendingLocation,
  );

  useEffect(() => {
    if (!pendingLocation && !isConfirmingRef.current) {
      router.replace(`/matching/location?field=${field}`);
    }
  }, [field, pendingLocation, router]);

  useEffect(() => {
    if (!pendingLocation) {
      return;
    }

    let cancelled = false;

    reverseGeocodeLocation(center)
      .then((details) => {
        if (cancelled) {
          return;
        }

        setSelectedLocation((previousLocation) => {
          if (!previousLocation) {
            return previousLocation;
          }

          return {
            ...previousLocation,
            latitude: center.lat,
            longitude: center.lng,
            placeName: details.placeName || details.roadAddress || previousLocation.placeName,
            roadAddress: details.roadAddress || previousLocation.roadAddress,
          };
        });
      })
      .catch(() => {
        // 주소 조회에 실패해도 현재 위치 조정은 계속할 수 있습니다.
      });

    return () => {
      cancelled = true;
    };
  }, [center, pendingLocation]);

  const updateLocationDetails = useCallback((coordinate: MapCoordinate) => {
    setCenter(coordinate);
  }, []);

  if (!pendingLocation || !selectedLocation) {
    return null;
  }

  const handleConfirm = () => {
    isConfirmingRef.current = true;
    setLocation(field, {
      ...selectedLocation,
      latitude: center.lat,
      longitude: center.lng,
    });
    setPendingLocation(null);
    router.push(field === 'destination' ? '/matching/time' : '/matching');
  };

  return (
    <div
      aria-label={`${getMatchingLocationLabel(field)} 위치 조정`}
      className="relative mx-auto h-dvh min-h-[780px] w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]"
    >
      <main className="relative h-[780px]" aria-label="지도에서 위치 조정">
        <Map
          className="absolute inset-0 h-[780px]"
          clusterMarkers={false}
          defaultCenter={center}
          showCurrentLocationButton={false}
          showZoomControls={false}
          onCenterChange={updateLocationDetails}
          onUserLocationChange={updateLocationDetails}
          ref={mapRef}
        >
          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="absolute top-[39.5%] left-1/2 -translate-x-1/2">
              {field === 'departure' ? (
                <StartPin aria-label="출발 위치" />
              ) : (
                <DestinationPin aria-label="도착 위치" />
              )}
            </div>
          </div>
          <MyLocationButton
            className="absolute right-4 bottom-[159px] z-30"
            onClick={() => mapRef.current?.requestCurrentLocation()}
          />
        </Map>
      </main>

      <section
        aria-label={`선택한 ${getMatchingLocationLabel(field)}`}
        className="absolute inset-x-0 bottom-0 z-40 h-[215px] overflow-hidden rounded-t-[24px] bg-[var(--color-bg-layer-default)] px-5 pt-6"
      >
        <div className="flex flex-col items-start gap-1.5">
          <Text as="h1" color="fg.neutral" variant="t5Bold">
            {selectedLocation.placeName}
          </Text>
          <Text color="fg.neutralSubtle" variant="t4Regular">
            {selectedLocation.roadAddress || '도로명주소'}
          </Text>
        </div>
        <Button
          className="absolute right-5 bottom-5 !h-[52px] !min-h-[52px] !w-[353px] !rounded-[8px] !bg-[var(--color-bg-brand-solid)] !px-4 !py-3 active:!bg-[var(--color-bg-brand-solid-pressed)]"
          size="large"
          type="button"
          variant="brand-solid"
          width="fill"
          onClick={handleConfirm}
        >
          {getMatchingLocationPanelActionLabel(field)}
        </Button>
      </section>

      <header className="absolute top-0 left-0 z-50 h-14 w-full">
        <BackButton
          className="absolute top-1.5 left-1.5"
          href={`/matching/location?field=${field}`}
        />
      </header>
    </div>
  );
}
