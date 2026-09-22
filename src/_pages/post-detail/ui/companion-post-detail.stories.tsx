import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CompanionPostDetail, type CompanionPostDetailProps } from '@/_pages/post-detail';

const companionPost: CompanionPostDetailProps['post'] = {
  type: 'COMPANION',
  id: 10,
  title: '택시 같이 타실 분 구해요!',
  description: '판교역 → 유스페이스까지 차 같이 타실 분을 찾아요.',
  author: { nickname: '우림', profile_image_url: null },
  transport: 'TAXI',
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  departure_at: '2026-08-24T09:40:00.000Z',
  departure_location: '판교역 2번 출구',
  destination: '유스페이스 앞',
  is_expired: false,
  participants: [
    { id: 1, nickname: 'CAN', profile_image_url: null },
    { id: 2, nickname: 'D', profile_image_url: null },
  ],
};

const meta = {
  title: 'Pages/PostDetail/CompanionPostDetail',
  component: CompanionPostDetail,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[361px] bg-[var(--color-bg-layer-default)] shadow-[0_8px_12px_rgba(0,0,0,0.18)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CompanionPostDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    post: companionPost,
  },
};
