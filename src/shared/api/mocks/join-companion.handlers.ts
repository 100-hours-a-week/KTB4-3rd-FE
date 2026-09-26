import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const joinCompanionHandlers = [
  http.post('*/companion-posts/:companionId/participants', ({ request, params }) => {
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

    if (companionId === 11) {
      return errorResponse('취소된 동행모집입니다', 'COMPANION_POST_CLOSED', null, 410);
    }

    if (companionId === 5) {
      return errorResponse('이미 참여 중인 게시글입니다', 'ALREADY_JOINED', null, 409);
    }

    if (companionId === 999) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (![1, 10].includes(companionId)) {
      return errorResponse('존재하지 않는 게시글입니다', 'POST_NOT_FOUND', null, 404);
    }

    return HttpResponse.json(
      {
        message: '채팅방에 참여했습니다',
        data: { chat_room_id: companionId === 10 ? 501 : 101 },
      },
      {
        status: 201,
        headers: { Location: `/companion-posts/${companionId}/participants/1` },
      },
    );
  }),
];
