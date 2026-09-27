import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';

import type { ChatRoomListQuery, ChatRoomListResponse } from './chat-room-list.types';

export async function getChatRoomList({ kind, cursor }: ChatRoomListQuery = {}) {
  const accessToken = await getAccessToken();
  const searchParams = new URLSearchParams();

  if (kind) {
    searchParams.set('kind', kind);
  }

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  const query = searchParams.toString();

  return apiFetch<ChatRoomListResponse>(`/chat-rooms${query ? `?${query}` : ''}`, {
    token: accessToken,
  });
}
