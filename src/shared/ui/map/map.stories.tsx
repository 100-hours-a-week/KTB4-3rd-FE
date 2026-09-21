import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState, type ComponentProps } from 'react';

import { Map } from './map';
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

  return (
    <div className="relative h-screen">
      <Map {...args} className="h-full" onCenterChange={setSelectedCenter} />
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

export const LocationSelection: Story = {
  render: (args) => <LocationSelectionPreview {...args} />,
  args: {
    className: 'h-full',
    clusterMarkers: false,
    markers: [],
    selectionMode: true,
  },
};
