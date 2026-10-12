import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Notification } from '@/entities/notification';

import { NotificationPageLoading, NotificationPageView } from './NotificationPage';

const now = new Date().toISOString();

const unreadNotifications: Notification[] = [
  {
    id: 901,
    type: 'CARPOOL_REQUEST_ACCEPTED',
    event_id: 1,
    target_chat_room_id: 11,
    target_post_id: null,
    content: '김춘배님이 동승 요청을 수락했어요',
    read_at: null,
    created_at: now,
  },
  {
    id: 902,
    type: 'SETTLEMENT_REQUESTED',
    event_id: 2,
    target_chat_room_id: 12,
    target_post_id: null,
    content: '정산 요청이 도착했어요',
    read_at: null,
    created_at: now,
  },
  {
    id: 903,
    type: 'COMMENT_CREATED',
    event_id: 3,
    target_chat_room_id: null,
    target_post_id: 88,
    content: '우림님이 댓글을 남겼어요',
    read_at: null,
    created_at: now,
  },
];

const meta = {
  title: 'Pages/Notification',
  component: NotificationPageView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotificationPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {
  args: {
    notifications: unreadNotifications,
  },
};

export const Unread: Story = {
  args: {
    activeTab: 'unread',
    notifications: unreadNotifications,
  },
};

export const Loading: Story = {
  render: () => <NotificationPageLoading />,
};
