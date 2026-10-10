'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { StartPin } from '@/entities/map-pin';
import { useCarpoolCreateStore, type CarpoolCreateLocation } from '@/features/carpool-registration';
import { reverseGeocodeLocation } from '@/features/post-location';
import { BackButton } from '@/shared/ui/back-button';
import { LocationInputButton } from '@/shared/ui/location-input-button';
import { Map, MyLocationButton, type MapRef } from '@/shared/ui/map';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import { SEOUL_STATION_COORDINATE } from '../model/carpool-location'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

const LOCATION_ROUTE = '/carpools/new/location';

function toLocationRoute(field: 'departure' | 'destination') {
  return `${LOCATION_ROUTE}?field=${field}`;
}

function isValidLocation(
  location: CarpoolCreateLocation | null,
): location is CarpoolCreateLocation {
  return Boolean(
    location &&
    location.name.trim() &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180,
  );
}

export function CarpoolCreatePage() {
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const geocodingRequestId = useRef(0);
  const origin = useCarpoolCreateStore((state) => state.draft.origin);
  const destination = useCarpoolCreateStore((state) => state.draft.destination);
  const setOrigin = useCarpoolCreateStore((state) => state.setOrigin);

  useEffect(
    () => () => {
      geocodingRequestId.current += 1;
    },
    [],
  );

  const handleUserLocationChange = useCallback(
    (coordinate: { lat: number; lng: number }) => {
      const requestId = ++geocodingRequestId.current;
      const fallbackName = '현재 위치';
      setOrigin({ name: fallbackName, ...coordinate });

      void reverseGeocodeLocation(coordinate)
        .then(({ placeName, roadAddress }) => {
          if (requestId !== geocodingRequestId.current) {
            return;
          }

          setOrigin({ name: placeName || roadAddress || fallbackName, ...coordinate });
        })
        .catch(() => {
          // 주소를 찾지 못해도 좌표는 출발지로 유지합니다.
        });
    },
    [setOrigin],
  );

  const handleUserLocationError = useCallback(() => {
    if (isValidLocation(useCarpoolCreateStore.getState().draft.origin)) {
      return;
    }

    setOrigin({ name: '서울역', ...SEOUL_STATION_COORDINATE });
    useSnackbarStore
      .getState()
      .showSnackbar('현재 위치를 찾지 못해 서울역을 표시했어요.', 'critical');
  }, [setOrigin]);

  const mapCenter = isValidLocation(origin)
    ? { lat: origin.lat, lng: origin.lng }
    : SEOUL_STATION_COORDINATE;

  return (
    <div
      aria-label="카풀 등록 위치 선택"
      className="relative mx-auto h-dvh min-h-[780px] w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]"
    >
      <main className="relative h-[780px]" aria-label="카풀 등록 지도">
        <Map
          className="absolute inset-0 h-[780px]"
          clusterMarkers={false}
          defaultCenter={mapCenter}
          locateOnMount={!isValidLocation(origin)}
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
        aria-label="출발지와 도착지 입력"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[calc(205px+env(safe-area-inset-bottom,0px))] w-full max-w-[393px] flex-col gap-3 overflow-hidden rounded-t-[20px] bg-[var(--color-bg-layer-default)] px-5 pt-10 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <LocationInputButton
          aria-label="출발지"
          clearButton={false}
          placeholder="출발지"
          prefix={null}
          value={origin?.name ?? null}
          onClick={() => router.push(toLocationRoute('departure'))}
        />
        <LocationInputButton
          aria-label="도착지"
          clearButton={false}
          placeholder="어디로 갈까요?"
          prefix={null}
          value={destination?.name ?? null}
          onClick={() => router.push(toLocationRoute('destination'))}
        />
      </div>

      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton className="absolute top-1.5 left-1.5" href="/matching" />
      </header>
    </div>
  );
}
