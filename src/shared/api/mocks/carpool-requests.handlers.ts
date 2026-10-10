import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, getBearerToken } from './mock-utils';

const REQUESTS = {
  SENT: [
    {
      id: 88,
      carpool_id: 51,
      status: 'ACCEPTED',
      content: '판교역에서 같이 가고 싶습니다!',
      counterpart: { id: 7, name: '김우림', profile_image_url: null },
      origin_name: '판교역',
      dest_name: '강남역',
      departure_at: '2026-10-12T08:30:00.000Z',
      chat_room_id: 620,
      created_at: '2026-10-10T08:10:00.000Z',
    },
  ],
  RECEIVED: [
    {
      id: 90,
      carpool_id: 53,
      status: 'PENDING',
      content: '판교역 2번 출구에서 기다릴게요',
      counterpart: {
        id: 9,
        name: '이루디',
        profile_image_url: 'https://cdn.moyeota.app/p/9.jpg',
      },
      origin_name: '판교역',
      dest_name: '강남역',
      departure_at: '2026-10-12T08:30:00.000Z',
      created_at: '2026-10-10T08:05:00.000Z',
    },
  ],
} as const;

function unauthorizedResponse() {
  return HttpResponse.json(
    { message: '로그인이 필요합니다', error: { code: 'UNAUTHORIZED', field: null } },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
  );
}

export const carpoolRequestsHandlers = [
  http.get('*/users/me/carpool-requests', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const searchParams = new URL(request.url).searchParams;
    const direction = searchParams.get('direction');

    if (direction !== 'SENT' && direction !== 'RECEIVED') {
      return HttpResponse.json(
        {
          message: '조회 조건을 확인해주세요',
          error: { code: 'VALIDATION_ERROR', field: 'direction' },
        },
        { status: 400 },
      );
    }

    if (searchParams.get('cursor') === 'invalid') {
      return HttpResponse.json(
        { message: '잘못된 커서입니다', error: { code: 'INVALID_CURSOR' } },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: { direction, items: REQUESTS[direction], next_cursor: null },
    });
  }),
];
