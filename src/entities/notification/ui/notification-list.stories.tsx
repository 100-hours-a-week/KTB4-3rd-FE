import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Notification } from '../model/notification';
import { NotificationList } from './notification-list';
import { NotificationListSkeleton } from './notification-list-skeleton';

const now = new Date('2026-09-04T09:00:30');

const notifications: Notification[] = [
  {
    id: 901,
    type: 'CARPOOL_REQUEST_ACCEPTED',
    event_id: 1,
    target_chat_room_id: 11,
    target_post_id: null,
    content: '김춘배님이 동승 요청을 수락했어요',
    read_at: null,
    created_at: '2026-09-04T09:00:00',
  },
  {
    id: 902,
    type: 'SETTLEMENT_REQUESTED',
    event_id: 2,
    target_chat_room_id: 12,
    target_post_id: null,
    content: '정산 요청이 도착했어요',
    read_at: null,
    created_at: '2026-09-04T09:00:00',
  },
  {
    id: 903,
    type: 'COMMENT_CREATED',
    event_id: 3,
    target_chat_room_id: null,
    target_post_id: 88,
    content: '우림님이 댓글을 남겼어요',
    read_at: null,
    created_at: '2026-09-04T09:00:00',
  },
  {
    id: 904,
    type: 'CARPOOL_REQUEST_RECEIVED',
    event_id: 4,
    target_chat_room_id: null,
    target_post_id: 89,
    content: '새로운 카풀 요청이 왔어요',
    read_at: '2026-09-04T09:00:20',
    created_at: '2026-09-04T09:00:00',
  },
  {
    id: 905,
    type: 'MATCHING_COMPLETED',
    event_id: 5,
    target_chat_room_id: 13,
    target_post_id: null,
    content: '택시팟 매칭이 완료됐어요',
    read_at: '2026-09-04T09:00:20',
    created_at: '2026-09-04T09:00:00',
  },
];

const meta = {
  title: 'Entities/Notification/NotificationList',
  component: NotificationList,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[353px]">
        <Story />
      </div>
    ),
  ],
  args: { items: notifications, now },
} satisfies Meta<typeof NotificationList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { items: [] } };

export const Loading: Story = {
  render: () => <NotificationListSkeleton />,
};
