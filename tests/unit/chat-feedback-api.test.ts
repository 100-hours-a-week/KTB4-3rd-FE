import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  submitChatRatings,
  submitChatReport,
  type ChatMessageReportPayload,
  type ChatUserReportPayload,
  type SubmitChatRatingsPayload,
} from '@/features/chatting';
import { useAuthStore } from '@/entities/auth';
import { MOCK_CHAT_REPORT_SCENARIOS } from '@/shared/api/mocks/chat-feedback.handlers';

const ratingsPayload: SubmitChatRatingsPayload = {
  ratings: [
    { target_user_id: 7, score: 5 },
    { target_user_id: 9, score: 4 },
  ],
};

const messageReportPayload: ChatMessageReportPayload = {
  reason: 'ABUSE',
  reason_text: null,
  reported_message_id: 1441,
  reported_user_id: 7,
};

const userReportPayload: ChatUserReportPayload = {
  companion_id: 30,
  reason: 'NO_SHOW',
  reason_text: null,
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

  it('메시지 신고를 접수한다', async () => {
    const response = await submitChatReport(messageReportPayload);

    expect(response).toEqual({
      message: '신고가 접수되었습니다',
      data: { id: 4, created_at: '2026-09-06T09:00:00' },
    });
  });

  it('유저 단독 신고를 접수한다', async () => {
    const response = await submitChatReport(userReportPayload);

    expect(response).toEqual({
      message: '신고가 접수되었습니다',
      data: { id: 4, created_at: '2026-09-06T09:00:00' },
    });
  });

  it.each([
    [
      '메시지',
      {
        ...messageReportPayload,
        reported_message_id: MOCK_CHAT_REPORT_SCENARIOS.INVALID_MESSAGE_ID,
      },
    ],
    [
      '유저',
      { ...userReportPayload, companion_id: MOCK_CHAT_REPORT_SCENARIOS.INVALID_COMPANION_ID },
    ],
  ])('%s 신고 대상이 유효하지 않으면 거부한다', async (_label, payload) => {
    await expect(submitChatReport(payload)).rejects.toMatchObject({
      status: 400,
      code: 'REPORT_TARGET_INVALID',
      field: null,
    });
  });

  it('신고 대상 유저가 존재하지 않으면 거부한다', async () => {
    await expect(
      submitChatReport({
        ...messageReportPayload,
        reported_user_id: MOCK_CHAT_REPORT_SCENARIOS.REPORTED_USER_NOT_FOUND_ID,
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'REPORTED_USER_NOT_FOUND',
      field: 'reported_user_id',
    });
  });

  it.each([
    [
      '메시지',
      {
        ...messageReportPayload,
        reported_message_id: MOCK_CHAT_REPORT_SCENARIOS.DUPLICATE_MESSAGE_ID,
      },
      'reported_message_id',
      '이미 신고한 메시지입니다',
    ],
    [
      '유저',
      { ...userReportPayload, companion_id: MOCK_CHAT_REPORT_SCENARIOS.DUPLICATE_COMPANION_ID },
      'reported_user_id',
      '이미 신고한 유저입니다',
    ],
  ])('%s 중복 신고이면 409를 반환한다', async (_label, payload, field, message) => {
    await expect(submitChatReport(payload)).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_REPORT',
      field,
      message,
    });
  });

  it.each([
    [
      '메시지',
      {
        ...messageReportPayload,
        reported_message_id: MOCK_CHAT_REPORT_SCENARIOS.INTERNAL_SERVER_ERROR_MESSAGE_ID,
      },
    ],
    [
      '유저',
      {
        ...userReportPayload,
        companion_id: MOCK_CHAT_REPORT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID,
      },
    ],
  ])('%s 신고 처리 중 서버 오류가 발생하면 500을 반환한다', async (_label, payload) => {
    await expect(submitChatReport(payload)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      field: null,
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
