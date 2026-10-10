import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const joinRequestErrors: Record<number, [string, string, number]> = {
  2: ['이미 대기 중인 참여 요청이 있습니다', 'REQUEST_ALREADY_PENDING', 409],
  3: ['모집 인원이 가득 찼습니다', 'CAPACITY_FULL', 409],
  4: ['모집이 종료되었습니다', 'CARPOOL_CLOSED', 409],
  5: ['이미 참여 중입니다', 'ALREADY_PARTICIPATING', 409],
  6: ['참여 요청 횟수를 초과했습니다', 'REQUEST_LIMIT_EXCEEDED', 409],
  7: ['본인의 모집에는 참여 요청을 할 수 없습니다', 'OWN_CARPOOL', 422],
  999: ['서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', 500],
};

export const carpoolJoinRequestHandlers = [
  http.post('*/carpools/:companionId/join-requests', async ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return errorResponse('로그인이 필요합니다', 'UNAUTHORIZED', null, 401);
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
      return errorResponse('모집을 찾을 수 없습니다', 'CARPOOL_NOT_FOUND', null, 404);
    }

    const error = joinRequestErrors[companionId];

    if (error) {
      return errorResponse(error[0], error[1], null, error[2]);
    }

    const requestId = 701 + companionId;

    return HttpResponse.json(
      {
        message: '참여 요청을 보냈습니다',
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
