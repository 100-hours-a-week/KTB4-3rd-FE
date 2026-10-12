import type { ApiResponse } from '@/shared/api/types';

export type NotificationType =
  | 'CARPOOL_REQUEST_RECEIVED'
  | 'CARPOOL_REQUEST_ACCEPTED'
  | 'SETTLEMENT_REQUESTED'
  | 'COMMENT_CREATED'
  | 'MATCHING_COMPLETED';

export type NotificationTab = 'all' | 'unread';

export type Notification = {
  id: number;
  type: NotificationType;
  event_id: number;
  target_chat_room_id: number | null;
  target_post_id: number | null;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type NotificationListQuery = {
  tab?: NotificationTab;
  cursor?: string;
};

export type NotificationListResponse = ApiResponse<{
  notifications: Notification[];
  next_cursor: string | null;
}>;

export type NotificationReadResponse = ApiResponse<{ read_at: string }>;

export type MarkAllNotificationsReadRequest = {
  max_notification_id: number | null;
};

export type MarkAllNotificationsReadResponse = ApiResponse<null>;
