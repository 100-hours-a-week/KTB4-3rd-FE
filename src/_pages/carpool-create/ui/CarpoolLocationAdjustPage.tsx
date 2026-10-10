'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { DestinationPin, StartPin } from '@/entities/map-pin';
import { useCarpoolCreateStore, type CarpoolLocationField } from '@/features/carpool-registration';
import { reverseGeocodeLocation } from '@/features/post-location';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { Map, MyLocationButton, type MapRef } from '@/shared/ui/map';
import type { MapCoordinate } from '@/shared/types/common';
import { Text } from '@/shared/ui/text';

import { SEOUL_STATION_COORDINATE } from '../model/carpool-location'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조
import {
  getCarpoolLocationConfirmLabel,
  getCarpoolLocationLabel,
  parseCarpoolLocationField,
} from '../model/carpool-location-field'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export function CarpoolLocationAdjustPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawField = searchParams.get('field');
  const field = parseCarpoolLocationField(rawField);
  const pendingLocation = useCarpoolCreateStore((state) => state.pendingLocation);
  const setOrigin = useCarpoolCreateStore((state) => state.setOrigin);
  const setDestination = useCarpoolCreateStore((state) => state.setDestination);
  const setPendingLocation = useCarpoolCreateStore((state) => state.setPendingLocation);
  const mapRef = useRef<MapRef>(null);
  const isConfirming = useRef(false);
  const geocodingRequestId = useRef(0);
  const [center, setCenter] = useState<MapCoordinate>(() => ({
    lat: pendingLocation?.location.lat ?? SEOUL_STATION_COORDINATE.lat,
    lng: pendingLocation?.location.lng ?? SEOUL_STATION_COORDINATE.lng,
  }));
  const [placeName, setPlaceName] = useState(pendingLocation?.location.name ?? '');
  const [roadAddress, setRoadAddress] = useState(pendingLocation?.roadAddress ?? '');
  const isValidPending = Boolean(field && pendingLocation && pendingLocation.field === field);

  useEffect(() => {
    if (!isValidPending && !isConfirming.current) {
      const safeField: CarpoolLocationField = field ?? 'departure';
      router.replace(`/carpools/new/location?field=${safeField}`);
    }
  }, [field, isValidPending, router]);

  const updateCenter = useCallback((coordinate: MapCoordinate) => {
    setCenter(coordinate);
    const requestId = ++geocodingRequestId.current;

    void reverseGeocodeLocation(coordinate)
      .then((details) => {
        if (requestId !== geocodingRequestId.current) {
          return;
        }

        setPlaceName(details.placeName || details.roadAddress || '선택한 위치');
        setRoadAddress(details.roadAddress || '');
      })
      .catch(() => {
        // 주소 조회에 실패해도 좌표 선택은 계속할 수 있습니다.
      });
  }, []);

  const handleLocationError = useCallback(() => {
    useSnackbarStore.getState().showSnackbar('현재 위치를 확인할 수 없어요.', 'critical');
  }, []);

  if (!isValidPending || !field || !pendingLocation) {
    return null;
  }

  const handleConfirm = () => {
    if (!placeName.trim() || !Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
      useSnackbarStore.getState().showSnackbar('선택한 위치를 확인할 수 없어요.', 'critical');
      return;
    }

    isConfirming.current = true;
    (field === 'departure' ? setOrigin : setDestination)({
      name: placeName.trim(),
      lat: center.lat,
      lng: center.lng,
    });
    setPendingLocation(null);
    router.push(field === 'destination' ? '/carpools/new/info' : '/carpools/new');
  };

  return (
    <div
      aria-label={`${getCarpoolLocationLabel(field)} 위치 조정`}
      className="relative mx-auto h-dvh min-h-[780px] w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]"
    >
      <main className="relative h-[780px]" aria-label="지도에서 위치 조정">
        <Map
          className="absolute inset-0 h-[780px]"
          clusterMarkers={false}
          defaultCenter={center}
          onCenterChange={updateCenter}
          onUserLocationChange={updateCenter}
          onUserLocationError={handleLocationError}
          showCurrentLocationButton={false}
          showZoomControls={false}
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
        aria-label={`선택한 ${getCarpoolLocationLabel(field)}`}
        className="fixed bottom-0 left-1/2 z-40 h-[calc(215px+env(safe-area-inset-bottom,0px))] w-full max-w-[393px] -translate-x-1/2 overflow-hidden rounded-t-[24px] bg-[var(--color-bg-layer-default)] px-5 pt-6 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex flex-col items-start gap-1.5">
          <Text as="h1" color="fg.neutral" variant="t5Bold">
            {placeName}
          </Text>
          <Text color="fg.neutralSubtle" variant="t4Regular">
            {roadAddress || '도로명주소'}
          </Text>
        </div>
        <Button
          className="absolute right-5 bottom-[calc(20px+env(safe-area-inset-bottom,0px))] !h-[52px] !min-h-[52px] !w-[353px] !rounded-[8px] !bg-[var(--color-bg-brand-solid)] !px-4 !py-3 active:!bg-[var(--color-bg-brand-solid-pressed)]"
          size="large"
          type="button"
          variant="brand-solid"
          width="fill"
          onClick={handleConfirm}
        >
          {getCarpoolLocationConfirmLabel(field)}
        </Button>
      </section>

      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton
          className="absolute top-1.5 left-1.5"
          href={`/carpools/new/location?field=${field}`}
        />
      </header>
    </div>
  );
}
