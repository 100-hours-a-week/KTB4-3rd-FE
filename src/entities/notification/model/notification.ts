export type NotificationType =
  | 'COMMENT_CREATED'
  | 'CARPOOL_REQUEST_RECEIVED'
  | 'CARPOOL_REQUEST_ACCEPTED'
  | 'SETTLEMENT_REQUESTED'
  | 'MATCHING_COMPLETED';

export type Notification = {
  id: number;
  type: NotificationType;
  event_id: number | null;
  target_chat_room_id: number | null;
  target_post_id: number | null;
  content: string;
  read_at: string | null;
  created_at: string;
};

export const notificationCategoryLabels: Record<NotificationType, '커뮤' | '카풀' | '택시'> = {
  COMMENT_CREATED: '커뮤',
  CARPOOL_REQUEST_RECEIVED: '카풀',
  CARPOOL_REQUEST_ACCEPTED: '카풀',
  SETTLEMENT_REQUESTED: '택시',
  MATCHING_COMPLETED: '택시',
};
