import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PostList, type Post } from '@/entities/post';

const posts: Post[] = [
  {
    type: 'COMPANION',
    id: 10,
    title: '판교역 → 강남역',
    author: { nickname: '우림', profile_image_url: null },
    transport: 'CAR',
    distance_m: 320,
    current_count: 2,
    capacity: 4,
    departure_at: '2026-09-05T08:30:00.000Z',
    is_expired: false,
  },
  {
    type: 'COMMUNITY',
    id: 88,
    title: '판교역 근처 카페 추천',
    author: { nickname: '루디', profile_image_url: null },
    distance_m: 540,
    comment_count: 3,
    created_at: '2026-09-03T10:00:00.000Z',
  },
];

const meta = {
  title: 'Entities/Post/PostList',
  component: PostList,
  args: {
    items: posts,
  },
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
} satisfies Meta<typeof PostList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
