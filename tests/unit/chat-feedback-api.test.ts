import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  submitChatRatings,
  submitChatReport,
  type SubmitChatRatingsPayload,
  type SubmitChatReportPayload,
} from '@/features/chatting';
import { useAuthStore } from '@/entities/auth';

const ratingsPayload: SubmitChatRatingsPayload = {
  ratings: [
    { target_user_id: 7, score: 5 },
    { target_user_id: 9, score: 4 },
  ],
};

const reportPayload: SubmitChatReportPayload = {
  reason: 'NO_SHOW',
  reason_text: null,
  reported_message_id: null,
  reported_user_id: 7,
};

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('chat feedback API', () => {
  it('동승자 평가를 한 번에 제출한다', async () => {
    const response = await submitChatRatings(30, ratingsPayload);

    expect(response).toEqual({
      message: '평가가 제출되었습니다',
      data: null,
    });
  });

  it('채팅 신고를 접수한다', async () => {
    const response = await submitChatReport(reportPayload);

    expect(response).toEqual({
      message: '신고가 접수되었습니다',
      data: { id: 4, created_at: '2026-09-06T09:00:00' },
    });
  });

  it('인증되지 않은 평가 요청을 거부한다', async () => {
    useAuthStore.getState().setAccessToken('invalid-token');

    await expect(submitChatRatings(30, ratingsPayload)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
