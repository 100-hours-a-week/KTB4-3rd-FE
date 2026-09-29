import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

import type {
  ChatRoomDetailResponse,
  ChatRoomMessagesResponse,
  ChatRoomReadMarkerResponse,
} from './chat-room.types';

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

export async function markChatRoomAsRead(
  roomId: string,
  lastReadMessageId: string,
): Promise<ChatRoomReadMarkerResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<ChatRoomReadMarkerResponse>(`/chat-rooms/${roomId}/read-marker`, {
    method: 'PUT',
    token: accessToken,
    body: JSON.stringify({ last_read_message_id: lastReadMessageId }),
  });
}
