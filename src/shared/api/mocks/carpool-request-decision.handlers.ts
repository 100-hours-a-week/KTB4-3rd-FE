import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const carpoolRequestDecisionHandlers = [
  http.patch('*/carpools/:companionId/join-requests/:requestId', async ({ request, params }) => {
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
    const requestId = Number(params.requestId);
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;

    if (body?.status !== 'ACCEPTED' && body?.status !== 'REJECTED') {
      return HttpResponse.json(
        {
          message: '유효하지 않은 상태입니다',
          error: {
            code: 'VALIDATION_ERROR',
            field: 'status',
            details: [
              {
                field: 'status',
                reason: body?.status === undefined ? 'REQUIRED' : 'INVALID_ENUM',
              },
            ],
          },
        },
        { status: 400 },
      );
    }

    if (companionId === 403) {
      return errorResponse('카풀 등록자만 처리할 수 있습니다', 'HOST_ONLY', null, 403);
    }

    if (requestId === 4091) {
      return errorResponse('이미 처리된 요청입니다', 'REQUEST_ALREADY_HANDLED', null, 409);
    }

    if (requestId === 4092) {
      return errorResponse('카풀 정원이 가득 찼습니다', 'CAPACITY_FULL', null, 409);
    }

    if (requestId === 4093) {
      return errorResponse('마감된 카풀입니다', 'CARPOOL_CLOSED', null, 409);
    }

    if (requestId === 500) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (companionId !== 1 || ![1, 2].includes(requestId)) {
      return errorResponse('존재하지 않는 카풀 요청입니다', 'CARPOOL_REQUEST_NOT_FOUND', null, 404);
    }

    if (body.status === 'ACCEPTED') {
      return HttpResponse.json(
        {
          message: '요청을 수락했습니다',
          data: {
            id: requestId,
            status: 'ACCEPTED',
            chat_room_id: 301,
            current_count: 3,
            capacity: 4,
          },
        },
        { status: 200 },
      );
    }

    return HttpResponse.json(
      {
        message: '요청을 거절했습니다',
        data: { id: requestId, status: 'REJECTED' },
      },
      { status: 200 },
    );
  }),
];
