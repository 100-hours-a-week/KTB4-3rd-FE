'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  CONGESTION_PIN_ANIMATION_DURATION_MS,
  CongestionLegend,
  getCongestionPinMarkerImage,
  type CongestionPinVariant,
  type CongestionLegendItem,
  type CongestionSpotDetailResponse,
  type CongestionSpotStatus,
} from '@/entities/congestion';
import { NotificationButton } from '@/entities/notification';
import {
  CONGESTION_TOGGLE_TRANSITION_DURATION_MS,
  congestionQueries,
  CongestionToggle,
} from '@/features/congestion';
import { HeaderUser } from '@/features/header-user';
import { useCurrentUserQuery } from '@/features/user-profile';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton, type MapRef, type MapViewport } from '@/shared/ui/map';

const congestionLegendItems: readonly CongestionLegendItem[] = [
  { color: '#CCE9FF', label: '원활·여유', range: '0~40' },
  { color: '#FBDC65', label: '혼잡', range: '41~70' },
  { color: '#FA342C', label: '붐빔·만석', range: '71~100' },
  { color: '#FA9D2C', label: '지연', range: '5분 이상' },
  { color: '#111111', label: '사고', range: '다중 제보' },
];

const pangyoStationCoordinate = { lat: 37.394512, lng: 127.111235 };

const congestionStatusToPinVariant: Record<CongestionSpotStatus, CongestionPinVariant> = {
  SMOOTH: 'available',
  CONGESTED: 'congested',
  CROWDED: 'busy',
  DELAYED: 'delayed',
  ACCIDENT: 'accident',
};

function toCongestionViewport(viewport: MapViewport) {
  return {
    sw_lat: viewport.southWest.lat,
    sw_lng: viewport.southWest.lng,
    ne_lat: viewport.northEast.lat,
    ne_lng: viewport.northEast.lng,
  };
}

function getSelectedMessage(detail: CongestionSpotDetailResponse | undefined) {
  return detail?.data.reason ?? detail?.message ?? '';
}

type CongestionPinTransition = {
  id: string;
  key: number;
  type: 'collapse' | 'expand';
};

function CongestionMap() {
  const mapRef = useRef<MapRef>(null);
  const pinTransitionTimerRef = useRef<number | null>(null);
  const pinTransitionKeyRef = useRef(0);
  const [mapViewport, setMapViewport] = useState<ReturnType<typeof toCongestionViewport> | null>(
    null,
  );
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [pinTransition, setPinTransition] = useState<CongestionPinTransition | null>(null);
  const spotsQuery = useQuery(congestionQueries.spots(mapViewport));
  const spots = useMemo(() => spotsQuery.data?.data.items ?? [], [spotsQuery.data]);
  const visibleSelectedPinId =
    selectedPinId !== null && spots.some((spot) => spot.id === selectedPinId)
      ? selectedPinId
      : null;
  const detailQuery = useQuery(congestionQueries.detail(visibleSelectedPinId));

  const handleViewportChange = useCallback((viewport: MapViewport) => {
    setMapViewport(toCongestionViewport(viewport));
  }, []);

  useEffect(
    () => () => {
      if (pinTransitionTimerRef.current !== null) {
        window.clearTimeout(pinTransitionTimerRef.current);
      }
    },
    [],
  );

  const markers = useMemo(
    () =>
      spots.map((spot) => {
        const variant = congestionStatusToPinVariant[spot.status];
        const isSelected = spot.id === visibleSelectedPinId;

        return {
          id: spot.id,
          image: getCongestionPinMarkerImage(variant, {
            animation: pinTransition?.id === String(spot.id) ? pinTransition.type : undefined,
            animationKey: pinTransition?.id === String(spot.id) ? pinTransition.key : undefined,
            isSelected,
            selectedMessage: getSelectedMessage(isSelected ? detailQuery.data : undefined),
          }),
          position: { lat: spot.lat, lng: spot.lng },
          title: `${spot.name} 혼잡도 핀`,
          zIndex: isSelected ? 1 : 0,
        };
      }),
    [detailQuery.data, pinTransition, spots, visibleSelectedPinId],
  );

  return (
    <div
      className="relative h-full min-h-0 w-full"
      data-congestion-map
      data-congestion-query-status={spotsQuery.status}
      data-testid="congestion-map"
    >
      <Map
        className="h-full"
        clusterMarkers
        defaultCenter={pangyoStationCoordinate}
        locateOnMount
        markerFocusOnClick={false}
        markers={markers}
        onMarkerClick={({ id }) => {
          const nextPinId = Number(id);
          const nextTransitionType = selectedPinId === nextPinId ? 'collapse' : 'expand';

          if (pinTransitionTimerRef.current !== null) {
            window.clearTimeout(pinTransitionTimerRef.current);
          }

          pinTransitionKeyRef.current += 1;
          setPinTransition({
            id: String(nextPinId),
            key: pinTransitionKeyRef.current,
            type: nextTransitionType,
          });
          setSelectedPinId((currentPinId) => (currentPinId === nextPinId ? null : nextPinId));
          pinTransitionTimerRef.current = window.setTimeout(() => {
            setPinTransition(null);
            pinTransitionTimerRef.current = null;
          }, CONGESTION_PIN_ANIMATION_DURATION_MS);
        }}
        onViewportChange={handleViewportChange}
        ref={mapRef}
        showCurrentLocationButton={false}
        showZoomControls={false}
        viewportDebounceMs={300}
      >
        <MyLocationButton
          aria-label="현재 위치로 이동"
          className="absolute right-4 bottom-8 z-20"
          onClick={() => mapRef.current?.requestCurrentLocation()}
        />
      </Map>
    </div>
  );
}

export function CongestionPage() {
  const router = useRouter();
  const communityNavigationTimerRef = useRef<number | null>(null);
  const currentUserQuery = useCurrentUserQuery();

  useEffect(
    () => () => {
      if (communityNavigationTimerRef.current !== null) {
        window.clearTimeout(communityNavigationTimerRef.current);
      }
    },
    [],
  );

  const handleCongestionToggle = (value: 'congestion' | 'community') => {
    if (value === 'community') {
      if (communityNavigationTimerRef.current !== null) {
        window.clearTimeout(communityNavigationTimerRef.current);
      }

      communityNavigationTimerRef.current = window.setTimeout(() => {
        router.push('/');
        communityNavigationTimerRef.current = null;
      }, CONGESTION_TOGGLE_TRANSITION_DURATION_MS);
    }
  };

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-fill)]">
      <Header
        className="z-30 bg-transparent"
        leftSlot={
          <span className="pt-2 pl-1.5">
            <Logo alt="모여타" size={27} variant="text" />
          </span>
        }
        rightSlot={
          <span className="flex items-center gap-1.5 pt-3 pr-1.5">
            <NotificationButton onClick={() => router.push('/notification')} />
            <HeaderUser user={currentUserQuery.data?.data} />
          </span>
        }
      />

      <main className="relative h-[calc(100dvh-72px)] min-h-0">
        <CongestionMap />
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto h-dvh w-full max-w-[393px]">
        <CongestionLegend
          className="pointer-events-auto absolute bottom-[calc(72px+env(safe-area-inset-bottom,0px)+16px)] left-3 z-20"
          heading="혼잡도"
          items={congestionLegendItems}
        />

        <CongestionToggle
          className="pointer-events-auto absolute top-[70px] left-5"
          defaultValue="congestion"
          onValueChange={handleCongestionToggle}
        />
      </div>

      <BottomNav
        activeItem="home"
        className="!fixed !right-auto !bottom-0 !left-1/2 !w-full !max-w-[393px] !-translate-x-1/2"
      />
    </div>
  );
}
