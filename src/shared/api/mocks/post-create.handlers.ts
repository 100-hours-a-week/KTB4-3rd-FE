import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const postCreateHandlers = [
  http.post('*/companion-posts', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return errorResponse('로그인이 필요합니다', 'UNAUTHORIZED', null, 401);
    }

    const body = (await request.json()) as { origin_name?: unknown };

    if (body.origin_name === '이미 등록된 출발지') {
      return errorResponse('게시글을 등록할 수 없습니다', 'POST_CREATE_FAILED', null, 409);
    }

    return HttpResponse.json(
      {
        message: '동행모집 게시글이 등록되었습니다',
        data: { id: 101 },
      },
      { status: 201 },
    );
  }),
  http.post('*/community-posts', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return errorResponse('로그인이 필요합니다', 'UNAUTHORIZED', null, 401);
    }

    const body = (await request.json()) as { title?: unknown };

    if (body.title === '등록 실패 게시글') {
      return errorResponse('게시글을 등록할 수 없습니다', 'POST_CREATE_FAILED', null, 409);
    }

    return HttpResponse.json(
      {
        message: '커뮤니티 게시글이 등록되었습니다',
        data: { id: 102 },
      },
      { status: 201 },
    );
  }),
];
