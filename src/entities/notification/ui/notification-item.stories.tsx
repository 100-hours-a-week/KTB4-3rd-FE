import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Notification } from '../model/notification';
import { NotificationItem } from './notification-item';
import { NotificationItemSkeleton } from './notification-item-skeleton';

const now = new Date('2026-09-04T09:00:30');

const notification: Notification = {
  id: 900,
  type: 'COMMENT_CREATED',
  event_id: 12,
  target_chat_room_id: null,
  target_post_id: 88,
  content: '우림님이 댓글을 남겼어요',
  read_at: null,
  created_at: '2026-09-04T09:00:00',
};

const meta = {
  title: 'Entities/Notification/NotificationItem',
  component: NotificationItem,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[353px]">
        <Story />
      </div>
    ),
  ],
  args: { notification, now },
} satisfies Meta<typeof NotificationItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {};

export const Clicked: Story = {
  args: { state: 'clicked' },
};

export const Read: Story = {
  args: { notification: { ...notification, read_at: '2026-09-04T09:00:20' } },
};

export const Carpool: Story = {
  args: {
    notification: {
      ...notification,
      type: 'CARPOOL_REQUEST_ACCEPTED',
      content: '김춘배님이 동승 요청을 수락했어요',
    },
  },
};

export const Taxi: Story = {
  args: {
    notification: {
      ...notification,
      type: 'SETTLEMENT_REQUESTED',
      content: '정산 요청이 도착했어요',
    },
  },
};

export const Loading: Story = {
  render: () => <NotificationItemSkeleton />,
};
