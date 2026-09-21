import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PostItem, type CompanionPost, type CommunityPost } from '@/entities/post';

const companionPost: CompanionPost = {
  type: 'COMPANION',
  id: 10,
  title: '판교역 → 강남역',
  author: { nickname: '우림', profile_image_url: null },
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  departure_at: '2026-09-05T08:30:00.000Z',
  is_expired: false,
};

const communityPost: CommunityPost = {
  type: 'COMMUNITY',
  id: 88,
  title: '판교역 근처 카페 추천',
  author: { nickname: '루디', profile_image_url: null },
  distance_m: 540,
  comment_count: 3,
  created_at: '2026-09-03T10:00:00.000Z',
};

const meta = {
  title: 'Entities/Post/PostItem',
  component: PostItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[393px] bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PostItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Companion: Story = {
  args: {
    post: companionPost,
  },
};

export const Community: Story = {
  args: {
    post: communityPost,
  },
};
