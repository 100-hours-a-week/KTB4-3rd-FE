import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Map } from './map';

const meta = {
  title: 'Shared/Map',
  component: Map,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Map>;

export default meta;

type Story = StoryObj<typeof meta>;

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
  args: {
    className: 'h-screen',
    clusterMarkers: false,
    markers: [],
    selectionMode: true,
  },
};
