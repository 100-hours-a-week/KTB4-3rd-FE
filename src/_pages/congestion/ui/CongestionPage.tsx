'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  CONGESTION_PIN_ANIMATION_DURATION_MS,
  CongestionLegend,
  getCongestionPinMarkerImage,
  type CongestionLegendItem,
} from '@/entities/congestion';
import { NotificationButton } from '@/entities/notification';
import { CONGESTION_TOGGLE_TRANSITION_DURATION_MS, CongestionToggle } from '@/features/congestion';
import { HeaderUser } from '@/features/header-user';
import { useCurrentUserQuery } from '@/features/user-profile';
import { BottomNav } from '@/shared/ui/BottomNav';
import { Header } from '@/shared/ui/header';
import { Logo } from '@/shared/ui/logo';
import { Map, MyLocationButton, type MapRef } from '@/shared/ui/map';

const congestionLegendItems: readonly CongestionLegendItem[] = [
  { color: '#CCE9FF', label: '원활·여유', range: '0~40' },
  { color: '#FBDC65', label: '혼잡', range: '41~70' },
  { color: '#FA342C', label: '붐빔·만석', range: '71~100' },
  { color: '#FA9D2C', label: '지연', range: '5분 이상' },
  { color: '#111111', label: '사고', range: '다중 제보' },
];

const pangyoStationCoordinate = { lat: 37.394512, lng: 127.111235 };

const congestionPinOverlays = [
  {
    ariaLabel: '여유 혼잡도 핀',
    id: 'available',
    position: { lat: 37.3961, lng: 127.1126 },
    selectedMessage: '현재 여유로운 상태예요',
    variant: 'available',
  },
  {
    ariaLabel: '사고 혼잡도 핀',
    id: 'accident',
    position: { lat: 37.3929, lng: 127.1121 },
    selectedMessage: '사고 제보가 접수됐어요',
    variant: 'accident',
  },
  {
    ariaLabel: '지연 혼잡도 핀',
    id: 'delayed',
    position: { lat: 37.3937, lng: 127.1083 },
    selectedMessage: '퇴근길 인파로 지연이\n5분정도 있어요',
    variant: 'delayed',
  },
  {
    ariaLabel: '붐빔 혼잡도 핀',
    id: 'busy',
    position: { lat: 37.3971, lng: 127.1098 },
    selectedMessage: '탑승 대기 인원이 많아요',
    variant: 'busy',
  },
  {
    ariaLabel: '혼잡 혼잡도 핀',
    id: 'congested',
    position: { lat: 37.3954, lng: 127.1151 },
    selectedMessage: '혼잡한 상태예요',
    variant: 'congested',
  },
] as const;

type CongestionPinTransition = {
  id: string;
  key: number;
  type: 'collapse' | 'expand';
};

function CongestionMap() {
  const mapRef = useRef<MapRef>(null);
  const pinTransitionTimerRef = useRef<number | null>(null);
  const pinTransitionKeyRef = useRef(0);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [pinTransition, setPinTransition] = useState<CongestionPinTransition | null>(null);

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
      congestionPinOverlays.map(({ ariaLabel, id, position, selectedMessage, variant }) => ({
        id,
        image: getCongestionPinMarkerImage(variant, {
          animation: pinTransition?.id === id ? pinTransition.type : undefined,
          animationKey: pinTransition?.id === id ? pinTransition.key : undefined,
          isSelected: id === selectedPinId,
          selectedMessage,
        }),
        position,
        title: ariaLabel,
        zIndex: id === selectedPinId ? 1 : 0,
      })),
    [pinTransition, selectedPinId],
  );

  return (
    <div className="relative h-full min-h-0 w-full" data-testid="congestion-map">
      <Map
        className="h-full"
        clusterMarkers
        defaultCenter={pangyoStationCoordinate}
        locateOnMount
        markerFocusOnClick={false}
        markers={markers}
        onMarkerClick={({ id }) => {
          const nextPinId = String(id);
          const nextTransitionType = selectedPinId === nextPinId ? 'collapse' : 'expand';

          if (pinTransitionTimerRef.current !== null) {
            window.clearTimeout(pinTransitionTimerRef.current);
          }

          pinTransitionKeyRef.current += 1;
          setPinTransition({
            id: nextPinId,
            key: pinTransitionKeyRef.current,
            type: nextTransitionType,
          });
          setSelectedPinId((currentPinId) => (currentPinId === nextPinId ? null : nextPinId));
          pinTransitionTimerRef.current = window.setTimeout(() => {
            setPinTransition(null);
            pinTransitionTimerRef.current = null;
          }, CONGESTION_PIN_ANIMATION_DURATION_MS);
        }}
        ref={mapRef}
        showCurrentLocationButton={false}
        showZoomControls={false}
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
