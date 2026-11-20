import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const carpoolLeaveHandlers = [
  http.delete('*/carpools/:companionId/participants/me', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
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

    const companionId = Number(params.companionId);

    if (companionId === 7) {
      return errorResponse(
        '카풀 등록자는 운행 종료 이후에야 나갈 수 있습니다',
        'HOST_CANNOT_LEAVE',
        null,
        403,
      );
    }

    if (companionId === 8) {
      return errorResponse('운행 중에는 나갈 수 없습니다', 'RIDE_IN_PROGRESS', null, 409);
    }

    if (companionId === 404 || !Number.isInteger(companionId) || companionId < 1) {
      return errorResponse('존재하지 않는 카풀입니다', 'CARPOOL_NOT_FOUND', null, 404);
    }

    if (companionId === 999) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
