import type { Meta } from '@storybook/nextjs-vite';
import type { ReactNode } from 'react';

import { CarpoolDetail } from './carpool-detail';

const meta = {
  title: 'Entities/CarpoolDetail',
  component: CarpoolDetail,
  parameters: {
    layout: 'centered',
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="w-[361px] bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CarpoolDetail>;

export default meta;
type Story = { name?: string; render: () => ReactNode };

const carpool = {
  status: 'RECRUITING',
  host: { id: 1, name: '모여타', profile_image_url: null },
  origin_name: '서울역 3번 출구',
  dest_name: '인천국제공항 제1터미널',
  departure_at: '2026-10-12T09:30:00',
  car_model: '현대 아반떼',
  current_count: 2,
  capacity: 4,
  is_full: false,
  participants: [
    { id: 1, name: '모여타', profile_image_url: null },
    { id: 2, name: '하늘', profile_image_url: null },
  ],
};

export const Recruiting: Story = {
  render: () => (
    <CarpoolDetail
      carpool={carpool}
      isCheckingRequest={false}
      isHost={false}
      isParticipant={false}
      onRequestClick={() => undefined}
      status="content"
    />
  ),
};

export const CheckingLatestStatus: Story = {
  name: '최신 상태 확인 중',
  render: () => (
    <CarpoolDetail
      carpool={carpool}
      isCheckingRequest
      isHost={false}
      isParticipant={false}
      onRequestClick={() => undefined}
      status="content"
    />
  ),
};

export const Loading: Story = { render: () => <CarpoolDetail status="loading" /> };

export const Error: Story = {
  render: () => (
    <CarpoolDetail
      errorMessage="네트워크 상태를 확인해 주세요."
      onRetry={() => undefined}
      status="error"
    />
  ),
};
