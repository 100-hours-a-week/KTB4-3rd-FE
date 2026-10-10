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
  http.patch('*/carpools/:carpoolId/join-requests/:requestId', async ({ params, request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return HttpResponse.json(
        { message: '로그인이 필요합니다', error: { code: 'UNAUTHORIZED', field: null } },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    const body = (await request.json()) as { status?: unknown };
    if (body.status !== 'ACCEPTED' && body.status !== 'REJECTED') {
      return HttpResponse.json(
        {
          message: '유효하지 않은 상태입니다',
          error: { code: 'VALIDATION_ERROR', field: 'status' },
        },
        { status: 400 },
      );
    }

    const data =
      body.status === 'ACCEPTED'
        ? {
            id: Number(params.requestId),
            status: 'ACCEPTED',
            chat_room_id: 620,
            current_count: 2,
            capacity: 4,
          }
        : { id: Number(params.requestId), status: 'REJECTED' };

    return HttpResponse.json({ message: '요청을 처리했습니다', data });
  }),
];
