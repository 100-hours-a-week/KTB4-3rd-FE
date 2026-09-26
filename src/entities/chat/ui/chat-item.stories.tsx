import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatItem, type ChatRoomListItem } from '@/entities/chat';

const chatRoom: ChatRoomListItem = {
  id: 501,
  companion_id: 10,
  kind: 'TAXI_POT',
  title: '판교역 → 유스페이스',
  host: { profile_image_url: null },
  current_count: 3,
  capacity: 4,
  has_unread: true,
};

const meta = {
  title: 'Entities/Chat/ChatItem',
  component: ChatItem,
  args: {
    chatRoom,
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-[353px] bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChatItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHostImage: Story = {
  args: {
    chatRoom: {
      ...chatRoom,
      host: { profile_image_url: '/avatars/avatar-default.svg' },
    },
  },
};
