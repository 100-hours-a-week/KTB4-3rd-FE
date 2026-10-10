import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, getBearerToken } from './mock-utils';

export const carpoolRequestReviewHandlers = [
  http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ params, request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return HttpResponse.json(
        { message: '로그인이 필요합니다', error: { code: 'UNAUTHORIZED', field: null } },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        id: Number(params.requestId),
        carpool_id: Number(params.carpoolId),
        status: 'PENDING',
        content: '판교역에서 같이 가고 싶습니다!',
        requester: { id: 9, name: '이루디', profile_image_url: null },
        created_at: '2026-10-10T08:10:00.000Z',
      },
    });
  }),
];
