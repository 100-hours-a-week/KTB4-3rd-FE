'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { StartPin } from '@/entities/map-pin';
import { useMatchingRegistrationStore } from '@/features/matching-registration';
import { reverseGeocodeLocation } from '@/features/post-location';
import {
  createCurrentLocation,
  CURRENT_LOCATION_ID,
  SEOUL_STATION_COORDINATE,
  SEOUL_STATION_LOCATION,
  useMatchingStore,
} from '@/_pages/matching/model/matching-store';
import { BackButton } from '@/shared/ui/back-button';
import { LocationInputButton } from '@/shared/ui/location-input-button';
import { Map, MyLocationButton, type MapRef } from '@/shared/ui/map';

const MATCHING_LOCATION_ROUTE = '/matching/location';

function getLocationRoute(field: 'departure' | 'destination') {
  return `${MATCHING_LOCATION_ROUTE}?field=${field}`;
}

export function MatchingPage() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const geocodingRequestIdRef = useRef(0);
  const departure = useMatchingStore((state) => state.departure);
  const destination = useMatchingStore((state) => state.destination);
  const setLocation = useMatchingStore((state) => state.setLocation);
  const setOrigin = useMatchingRegistrationStore((state) => state.setOrigin);
  const setDestination = useMatchingRegistrationStore((state) => state.setDestination);

  useEffect(() => {
    setOrigin(
      departure
        ? {
            name: departure.placeName,
            lat: departure.latitude ?? null,
            lng: departure.longitude ?? null,
          }
        : null,
    );
    setDestination(
      destination
        ? {
            name: destination.placeName,
            lat: destination.latitude ?? null,
            lng: destination.longitude ?? null,
          }
        : null,
    );
  }, [departure, destination, setDestination, setOrigin]);

  const mapCenter =
    departure?.latitude !== undefined && departure.longitude !== undefined
      ? { lat: departure.latitude, lng: departure.longitude }
      : SEOUL_STATION_COORDINATE;

  const handleUserLocationChange = useCallback(
    (coordinate: { lat: number; lng: number }) => {
      const requestId = ++geocodingRequestIdRef.current;

      setLocation(
        'departure',
        createCurrentLocation(coordinate, { placeName: '현재 위치', roadAddress: '' }),
      );

      reverseGeocodeLocation(coordinate)
        .then((details) => {
          if (requestId !== geocodingRequestIdRef.current) {
            return;
          }

          setLocation('departure', createCurrentLocation(coordinate, details));
        })
        .catch(() => {
          // 주소 조회에 실패해도 현재 좌표를 출발지로 유지합니다.
        });
    },
    [setLocation],
  );

  const handleUserLocationError = useCallback(() => {
    const currentDeparture = useMatchingStore.getState().departure;

    if (!currentDeparture || currentDeparture.id === SEOUL_STATION_LOCATION.id) {
      setLocation('departure', SEOUL_STATION_LOCATION);
    }
  }, [setLocation]);

  const departureValue =
    departure?.id === CURRENT_LOCATION_ID
      ? `현위치: ${departure.placeName}`
      : (departure?.placeName ?? null);

  return (
    <div
      aria-label="택시팟 등록"
      className="relative mx-auto h-dvh min-h-[780px] w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]"
    >
      <main className="relative h-[780px]" aria-label="택시팟 등록 지도">
        <Map
          className="absolute inset-0 h-[780px]"
          clusterMarkers={false}
          defaultCenter={mapCenter}
          locateOnMount={departure?.id === SEOUL_STATION_LOCATION.id}
          onUserLocationChange={handleUserLocationChange}
          onUserLocationError={handleUserLocationError}
          showCurrentLocationButton={false}
          showZoomControls={false}
          ref={mapRef}
        >
          <div className="pointer-events-none absolute inset-0 z-30">
            <div className="absolute top-[44.1%] left-1/2 -translate-x-1/2">
              <StartPin aria-label="출발 위치" />
            </div>
          </div>
          <MyLocationButton
            className="absolute right-[9px] bottom-[159px] z-30"
            onClick={() => mapRef.current?.requestCurrentLocation()}
          />
        </Map>
      </main>

      <div className="absolute inset-x-0 bottom-0 z-40 flex h-[205px] flex-col gap-3 overflow-hidden rounded-t-[20px] bg-[var(--color-bg-layer-default)] px-5 pt-10">
        <LocationInputButton
          aria-label="출발지"
          clearButton={false}
          placeholder="출발지"
          prefix={null}
          value={departureValue}
          onClick={() => router.push(getLocationRoute('departure'))}
        />
        <LocationInputButton
          aria-label="도착지"
          clearButton={false}
          placeholder="어디로 갈까요?"
          prefix={null}
          value={destination?.placeName ?? null}
          onClick={() => router.push(getLocationRoute('destination'))}
        />
      </div>

      <header className="absolute top-0 left-0 z-50 h-14 w-full">
        <BackButton className="absolute top-1.5 left-1.5" href="/" />
      </header>
    </div>
  );
}
