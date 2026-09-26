import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ChatList, type ChatRoomListItem } from '@/entities/chat';

const chatRooms: ChatRoomListItem[] = Array.from({ length: 6 }, (_, index) => ({
  id: 501 + index,
  companion_id: 10 + index,
  kind: 'TAXI_POT',
  title: '판교역 → 유스페이스',
  host: { profile_image_url: null },
  current_count: 4,
  capacity: 4,
  has_unread: index === 0,
}));

const meta = {
  title: 'Entities/Chat/ChatList',
  component: ChatList,
  args: {
    items: chatRooms,
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
} satisfies Meta<typeof ChatList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixItems: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
