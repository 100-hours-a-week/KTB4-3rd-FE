import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const joinRequestErrors: Record<number, [string, string, number]> = {
  2: ['이미 요청을 보낸 상태입니다', 'REQUEST_ALREADY_PENDING', 409],
  3: ['카풀 정원이 가득 찼습니다', 'CAPACITY_FULL', 409],
  4: ['마감된 카풀입니다', 'CARPOOL_CLOSED', 409],
  5: ['이미 참여 중인 카풀입니다', 'ALREADY_PARTICIPATING', 409],
  6: ['제한된 요청 수를 초과했습니다', 'REQUEST_LIMIT_EXCEEDED', 409],
  7: ['본인이 등록한 카풀에는 동승 요청을 보낼 수 없습니다', 'OWN_CARPOOL', 422],
  999: ['서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', 500],
};

export const carpoolJoinRequestHandlers = [
  http.post('*/carpools/:companionId/join-requests', async ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return HttpResponse.json(
        {
          message: '로그인이 필요합니다',
          error: { code: 'UNAUTHORIZED', field: null },
        },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    const companionId = Number(params.companionId);
    const payload = (await request.json().catch(() => null)) as { content?: unknown } | null;

    if (!payload || typeof payload.content !== 'string' || payload.content.length === 0) {
      return HttpResponse.json(
        {
          message: '요청 메시지를 확인해주세요',
          error: {
            code: 'VALIDATION_ERROR',
            field: 'content',
            details: [{ field: 'content', reason: 'REQUIRED' }],
          },
        },
        { status: 400 },
      );
    }

    if (payload.content.length > 200) {
      return HttpResponse.json(
        {
          message: '요청 메시지를 확인해주세요',
          error: {
            code: 'VALIDATION_ERROR',
            field: 'content',
            details: [{ field: 'content', reason: 'LENGTH_OUT_OF_RANGE' }],
          },
        },
        { status: 400 },
      );
    }

    if (companionId === 404 || !Number.isInteger(companionId) || companionId < 1) {
      return errorResponse('존재하지 않는 카풀입니다', 'CARPOOL_NOT_FOUND', null, 404);
    }

    const error = joinRequestErrors[companionId];

    if (error) {
      return errorResponse(error[0], error[1], null, error[2]);
    }

    const requestId = 701 + companionId;

    return HttpResponse.json(
      {
        message: '카풀 요청이 등록되었습니다',
        data: {
          id: requestId,
          carpool_id: companionId,
          status: 'PENDING',
          created_at: '2026-10-10T00:00:00.000Z',
        },
      },
      {
        status: 201,
        headers: { Location: `/carpools/${companionId}/join-requests/${requestId}` },
      },
    );
  }),
];
