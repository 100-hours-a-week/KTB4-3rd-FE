import { getAccessToken } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import type { ApiResponse } from '@/shared/api/types';

export type ChatReportReason = 'ABUSE' | 'UNSETTLED' | 'NO_SHOW' | 'ETC';

export type SubmitChatReportPayload = {
  reported_user_id: number;
  reported_message_id: number | null;
  reason: ChatReportReason;
  reason_text: string | null;
};

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
