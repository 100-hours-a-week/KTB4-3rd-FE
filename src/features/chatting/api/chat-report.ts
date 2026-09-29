import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type ChatReportReason = 'ABUSE' | 'UNSETTLED' | 'NO_SHOW' | 'ETC';

type BaseChatReportPayload = {
  reported_user_id: number;
  reason: ChatReportReason;
  reason_text: string | null;
};

export type ChatMessageReportPayload = BaseChatReportPayload & {
  companion_id?: never;
  reported_message_id: number;
};

export type ChatUserReportPayload = BaseChatReportPayload & {
  companion_id: number;
  reported_message_id?: never;
};

export type SubmitChatReportPayload = ChatMessageReportPayload | ChatUserReportPayload;

export type ChatReportData = {
  id: number;
  created_at: string;
};

export type SubmitChatReportResponse = ApiResponse<ChatReportData>;

export async function submitChatReport(
  payload: SubmitChatReportPayload,
): Promise<SubmitChatReportResponse> {
  const accessToken = await getAccessToken();

  return apiFetch<SubmitChatReportResponse>('/reports', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify(payload),
  });
}
