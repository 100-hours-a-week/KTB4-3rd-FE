import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

import type { ChatRoomDetailResponse, ChatRoomMessagesResponse } from './chat-room.types';

export async function getChatRoomDetail(roomId: string): Promise<ChatRoomDetailResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<ChatRoomDetailResponse>(`/chat-rooms/${roomId}`, {
    token: accessToken,
  });
}

export async function getChatRoomMessages(
  roomId: string,
  cursor?: string,
): Promise<ChatRoomMessagesResponse> {
  const accessToken = await getAccessToken();
  const searchParams = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';

  return apiFetch<ChatRoomMessagesResponse>(`/chat-rooms/${roomId}/messages${searchParams}`, {
    token: accessToken,
  });
}
