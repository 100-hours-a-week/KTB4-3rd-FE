import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CommunityPostDetail, type CommunityPostDetailProps } from '@/_pages/post-detail';

const communityPost: CommunityPostDetailProps['post'] = {
  type: 'COMMUNITY',
  id: 88,
  title: '9007번 버스 줄 개김 ㅋㅋ',
  description: '한 20명 있는듯??',
  author: { nickname: '애롱롱', profile_image_url: null },
  distance_m: 540,
  comment_count: 3,
  created_at: '2026-09-03T10:00:00.000Z',
  comments: [
    {
      id: 1,
      author: { nickname: '유저1', profile_image_url: null },
      content: '와 레전드사건 ㅋㅋ',
    },
    {
      id: 2,
      author: { nickname: '유저2', profile_image_url: null },
      content: '진짜 사람 많네요',
    },
    {
      id: 3,
      author: { nickname: '유저3', profile_image_url: null },
      content: '저도 지금 근처예요',
    },
  ],
};

const meta = {
  title: 'Pages/PostDetail/CommunityPostDetail',
  component: CommunityPostDetail,
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
} satisfies Meta<typeof CommunityPostDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    post: communityPost,
  },
};
