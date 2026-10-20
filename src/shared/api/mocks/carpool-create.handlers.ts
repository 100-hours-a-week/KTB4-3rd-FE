import { http, HttpResponse } from 'msw';

import { MOCK_ACCESS_TOKEN, getBearerToken } from './mock-utils';

export const carpoolCreateHandlers = [
  http.post('*/carpools', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return HttpResponse.json(
        { message: '로그인이 필요합니다', error: { code: 'UNAUTHORIZED', field: null } },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    return HttpResponse.json(
      {
        message: '카풀 등록을 성공했습니다',
        data: { id: 51, chat_room_id: 620, capacity: 4, current_count: 1, status: 'RECRUITING' },
      },
      { status: 201, headers: { Location: '/carpools/51' } },
    );
  }),
];
