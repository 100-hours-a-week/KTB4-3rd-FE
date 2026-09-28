'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { StartPin } from '@/entities/map-pin';
import type { LocationSearchResult } from '@/features/location-search';
import { useMatchingRegistrationStore } from '@/features/matching-registration';
import { reverseGeocodeLocation } from '@/features/post-location';
import { BankAccountDialog, useCurrentUserQuery } from '@/features/user-profile';
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

function toRegistrationLocation(location: LocationSearchResult) {
  return {
    name: location.placeName,
    lat: location.latitude ?? null,
    lng: location.longitude ?? null,
  };
}

function getDepartureValue(departure: LocationSearchResult | null) {
  if (!departure) {
    return null;
  }

  if (departure.id === CURRENT_LOCATION_ID) {
    return departure.placeName ? `현위치: ${departure.placeName}` : null;
  }

  return departure.placeName || null;
}

export function MatchingPage() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const geocodingRequestIdRef = useRef(0);
  const [isBankAccountDialogDismissed, setIsBankAccountDialogDismissed] = useState(false);
  const currentUserQuery = useCurrentUserQuery();
  const departure = useMatchingStore((state) => state.departure);
  const destination = useMatchingStore((state) => state.destination);
  const setLocation = useMatchingStore((state) => state.setLocation);
  const setOrigin = useMatchingRegistrationStore((state) => state.setOrigin);
  const setDestination = useMatchingRegistrationStore((state) => state.setDestination);

  const currentUser = currentUserQuery.data?.data;
  const shouldShowBankAccountDialog =
    currentUser?.has_bank_account === false && !isBankAccountDialogDismissed;

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
      const provisionalLocation = createCurrentLocation(coordinate, {
        placeName: null,
        roadAddress: null,
      });

      setLocation('departure', provisionalLocation);
      setOrigin(toRegistrationLocation(provisionalLocation));

      reverseGeocodeLocation(coordinate)
        .then((details) => {
          if (requestId !== geocodingRequestIdRef.current) {
            return;
          }

          const resolvedLocation = createCurrentLocation(coordinate, details);

          setLocation('departure', resolvedLocation);
          setOrigin(toRegistrationLocation(resolvedLocation));
        })
        .catch(() => {
          // 주소 조회에 실패해도 현재 좌표를 출발지로 유지합니다.
        });
    },
    [setLocation, setOrigin],
  );

  const handleUserLocationError = useCallback(() => {
    const currentDeparture = useMatchingStore.getState().departure;

    if (!currentDeparture || currentDeparture.id === SEOUL_STATION_LOCATION.id) {
      setLocation('departure', SEOUL_STATION_LOCATION);
    }
  }, [setLocation]);

  const departureValue = getDepartureValue(departure);

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

      <div
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[calc(205px+env(safe-area-inset-bottom,0px))] w-full max-w-[393px] flex-col gap-3 overflow-hidden rounded-t-[20px] bg-[var(--color-bg-layer-default)] px-5 pt-10 pb-[env(safe-area-inset-bottom,0px)]"
        data-testid="matching-location-panel"
      >
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

      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton className="absolute top-1.5 left-1.5" href="/" />
      </header>

      <BankAccountDialog
        open={shouldShowBankAccountDialog}
        onDismiss={() => router.push('/')}
        onOpenChange={(open) => {
          if (!open) {
            setIsBankAccountDialogDismissed(true);
          }
        }}
      />
    </div>
  );
}
