import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const chatFeedbackHandlers = [
  http.post('*/companions/:companionId/ratings', async ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    if (String(params.companionId) === '404') {
      return errorResponse(
        '평가할 수 있는 동행이 아닙니다',
        'RATABLE_COMPANION_NOT_FOUND',
        null,
        404,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const ratings = isObject(body) ? body.ratings : undefined;

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return errorResponse('요청 값 검증에 실패했습니다.', 'VALIDATION_ERROR', 'ratings', 422);
    }

    const invalidRating = ratings.find(
      (rating) =>
        !isObject(rating) ||
        typeof rating.target_user_id !== 'number' ||
        !Number.isInteger(rating.target_user_id) ||
        typeof rating.score !== 'number' ||
        !Number.isInteger(rating.score) ||
        rating.score < 1 ||
        rating.score > 5,
    );

    if (invalidRating) {
      return errorResponse(
        '요청 값 검증에 실패했습니다.',
        'VALIDATION_ERROR',
        'ratings[0].score',
        422,
      );
    }

    return HttpResponse.json({ message: '평가가 제출되었습니다', data: null }, { status: 201 });
  }),
  http.post('*/reports', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    if (!isObject(body) || (body.reason === 'ETC' && !String(body.reason_text ?? '').trim())) {
      return errorResponse('기타 사유를 입력해주세요', 'VALIDATION_ERROR', 'reason_text', 400);
    }

    if (typeof body.reported_user_id !== 'number') {
      return errorResponse(
        '존재하지 않는 사용자입니다',
        'REPORTED_USER_NOT_FOUND',
        'reported_user_id',
        400,
      );
    }

    return HttpResponse.json(
      {
        message: '신고가 접수되었습니다',
        data: { id: 4, created_at: '2026-09-06T09:00:00' },
      },
      { status: 201 },
    );
  }),
];
