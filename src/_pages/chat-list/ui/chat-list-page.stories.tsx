import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { ChatRoomListItem } from '@/entities/chat';

import { ChatListPage, type ChatListPageStates } from '@/_pages/chat-list';
import { ChatListPageLoading } from './chat-list-page-loading';

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

const successStates: ChatListPageStates = {
  matching: {
    status: 'success',
    data: { items: [], next_cursor: null },
  },
  community: {
    status: 'success',
    data: { items: chatRooms, next_cursor: null },
  },
};

const emptyStates: ChatListPageStates = {
  matching: {
    status: 'success',
    data: { items: [], next_cursor: null },
  },
  community: {
    status: 'success',
    data: { items: [], next_cursor: null },
  },
};

const errorStates: ChatListPageStates = {
  matching: { status: 'error' },
  community: { status: 'error' },
};

const meta = {
  title: 'Pages/ChatList',
  component: ChatListPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-[var(--color-bg-layer-default)]">
        <Story />
      </div>
    ),
  ],
  args: {
    states: successStates,
  },
} satisfies Meta<typeof ChatListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixItems: Story = {};

export const Empty: Story = {
  args: {
    states: emptyStates,
  },
};

export const Error: Story = {
  args: {
    states: errorStates,
  },
};

export const Loading: Story = {
  render: () => <ChatListPageLoading />,
};
