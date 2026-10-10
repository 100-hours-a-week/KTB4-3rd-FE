import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState, type ComponentProps } from 'react';

import { Map } from './map';
import { loadKakaoMaps, loadKakaoServices } from './model/map-loader';
import type { KakaoAddressResult } from './model/kakao-map.types';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapCenterChangeSource, MapViewportChangeSource } from './model/map.types';

const meta = {
  title: 'Shared/Map',
  component: Map,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

function LocationSelectionPreview(args: ComponentProps<typeof Map>) {
  const [selectedCenter, setSelectedCenter] = useState<MapCoordinate | null>(null);
  const [locationDetails, setLocationDetails] = useState<{
    placeName: string | null;
    roadAddress: string | null;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );

  const handleCenterChange = (center: MapCoordinate) => {
    setSelectedCenter(center);
    setLocationDetails(null);
    setLocationStatus('loading');
  };

  useEffect(() => {
    if (!selectedCenter) {
      return;
    }

    let cancelled = false;
    const apiKey = args.apiKey ?? process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? '';

    loadKakaoMaps(apiKey)
      .then(() => loadKakaoServices())
      .then((services) => {
        const geocoder = new services.Geocoder();

        geocoder.coord2Address(
          selectedCenter.lng,
          selectedCenter.lat,
          (result: KakaoAddressResult[], status: string) => {
            if (cancelled) {
              return;
            }

            const firstResult = result[0];
            const roadAddress = firstResult?.road_address?.address_name ?? null;
            const placeName = firstResult?.road_address?.building_name ?? null;

            if (status !== services.Status.OK) {
              setLocationStatus('error');
              return;
            }

            setLocationDetails({ placeName, roadAddress });
            setLocationStatus('success');
          },
        );
      })
      .catch(() => {
        if (!cancelled) {
          setLocationDetails(null);
          setLocationStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [args.apiKey, selectedCenter]);

  return (
    <div className="relative h-screen">
      <Map {...args} className="h-full" onCenterChange={handleCenterChange} />
      <div
        aria-live="polite"
        className="pointer-events-none absolute top-4 right-4 left-4 z-10 rounded-xl bg-[var(--color-bg-layer-default)]/95 px-4 py-3 shadow-[0_2px_8px_rgb(0_0_0_/_12%)]"
      >
        <p className="text-sm font-semibold text-[var(--color-fg-neutral)]">선택한 위치</p>
        <p className="mt-1 text-sm text-[var(--color-fg-neutral-subtle)]">
          {selectedCenter
            ? `위도 ${selectedCenter.lat.toFixed(6)} · 경도 ${selectedCenter.lng.toFixed(6)}`
            : '지도를 움직여 위치를 선택해 주세요.'}
        </p>
        {selectedCenter && locationStatus === 'loading' ? (
          <p className="mt-2 text-sm text-[var(--color-fg-neutral-subtle)]">
            장소 정보를 불러오는 중…
          </p>
        ) : null}
        {selectedCenter && locationStatus === 'success' && locationDetails ? (
          <div className="mt-2 space-y-1 text-sm text-[var(--color-fg-neutral)]">
            <p>장소명: {locationDetails.placeName ?? '건물명 정보 없음'}</p>
            <p>도로명주소: {locationDetails.roadAddress ?? '도로명주소 정보 없음'}</p>
          </div>
        ) : null}
        {selectedCenter && locationStatus === 'error' ? (
          <p className="mt-2 text-sm text-[var(--color-fg-neutral-subtle)]">
            해당 위치의 장소 정보를 찾을 수 없습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const PostMarkers: Story = {
  args: {
    className: 'h-screen',
    markers: [
      { id: 1, position: { lat: 37.5665, lng: 126.978 }, title: '서울시청' },
      { id: 2, position: { lat: 37.5658, lng: 126.982 }, title: '게시글 위치' },
      { id: 3, position: { lat: 37.569, lng: 126.975 }, title: '게시글 위치' },
    ],
    selectionMode: false,
  },
};

export const UserLocation: Story = {
  args: {
    className: 'h-screen',
    clusterMarkers: false,
    markers: [],
    userLocation: { lat: 37.5547, lng: 126.9707 },
  },
};

export const OverlayContent: Story = {
  args: {
    children: (
      <button
        className="absolute top-24 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-md"
        type="button"
      >
        지도 위 콘텐츠
      </button>
    ),
    className: 'h-screen',
    showCurrentLocationButton: false,
    showZoomControls: false,
  },
};

export const LocationSelection: Story = {
  render: (args) => <LocationSelectionPreview {...args} />,
  args: {
    className: 'h-full',
    clusterMarkers: false,
    markers: [],
    selectionMode: true,
  },
};

export const CustomSelectionMarker: Story = {
  args: {
    className: 'h-screen',
    clusterMarkers: false,
    selectionMarker: {
      height: 56,
      src: '/map-pins/accompany-marker.svg',
      width: 54,
    },
    selectionMode: true,
  },
};

function ViewportMovementPreview(args: ComponentProps<typeof Map>) {
  const [source, setSource] = useState<MapViewportChangeSource | null>(null);
  const [center, setCenter] = useState<MapCoordinate>();
  const [centerChangeSource, setCenterChangeSource] =
    useState<MapCenterChangeSource>('programmatic');
  const move = (nextSource: MapCenterChangeSource) => {
    setCenterChangeSource(nextSource);
    setCenter(
      nextSource === 'selection' ? { lat: 37.5547, lng: 126.9707 } : { lat: 37.5665, lng: 126.978 },
    );
  };

  return (
    <div className="relative h-screen">
      <Map
        {...args}
        center={center}
        centerChangeSource={centerChangeSource}
        className="h-full"
        onViewportChange={(_, nextSource) => setSource(nextSource ?? null)}
      />
      <div className="absolute top-4 left-4 z-10 space-y-2 rounded-xl bg-[var(--color-bg-layer-default)] p-4 shadow-md">
        <p aria-live="polite">마지막 지도 이동 원인: {source ?? '지도 준비 중'}</p>
        <p className="text-sm">드래그·확대 버튼·현재 위치·아래 이동 버튼으로 원인을 확인하세요.</p>
        <div className="flex gap-2">
          <button
            className="rounded border px-3 py-2"
            type="button"
            onClick={() => move('selection')}
          >
            선택 위치로 이동
          </button>
          <button
            className="rounded border px-3 py-2"
            type="button"
            onClick={() => move('programmatic')}
          >
            코드로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

export const ViewportMovement: Story = {
  name: '지도 이동 원인 확인',
  render: (args) => <ViewportMovementPreview {...args} />,
  args: { clusterMarkers: false, markers: [] },
};
