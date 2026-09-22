import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect, useState, type ComponentProps } from 'react';

import { Map } from './map';
import { loadKakaoMaps, loadKakaoServices } from './model/map-loader';
import type { KakaoAddressResult } from './model/kakao-map.types';
import type { MapCoordinate } from '@/shared/types/common';

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
