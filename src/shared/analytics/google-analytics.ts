'use client';

import { sendGAEvent } from '@next/third-parties/google';

export type AnalyticsParams = Record<string, boolean | number | string>;

export type GaEventName =
  | 'login_start'
  | 'login'
  | 'sign_up'
  | 'logout'
  | 'home_item_click'
  | 'map_pin_click'
  | 'community_post_view'
  | 'community_post_create'
  | 'community_comment_create'
  | 'carpool_view'
  | 'carpool_create'
  | 'carpool_request_send'
  | 'carpool_request_accept'
  | 'carpool_request_reject'
  | 'taxi_pot_view'
  | 'taxi_pot_create'
  | 'taxi_pot_join'
  | 'taxi_pot_leave'
  | 'settlement_meter_upload'
  | 'settlement_transfer_upload'
  | 'companion_post_view'
  | 'companion_post_create'
  | 'companion_join'
  | 'companion_leave'
  | 'rating_submit'
  | 'chat_room_enter'
  | 'chat_message_send'
  | 'message_report'
  | 'user_report'
  | 'notification_list_open'
  | 'notification_click'
  | 'congestion_view'
  | 'congestion_spot_click';

export function sendAnalyticsEvent(name: GaEventName, params?: AnalyticsParams): void {
  if (!process.env.NEXT_PUBLIC_GA_ID) {
    return;
  }

  sendGAEvent('event', name, params ?? {});
}
