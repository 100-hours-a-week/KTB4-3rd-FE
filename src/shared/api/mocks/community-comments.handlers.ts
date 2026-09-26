import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const MOCK_COMMENT_NEXT_CURSOR = 'v1.eyJsYXN0X2lkIjoxfQ';
const MOCK_COMMENT_ID = 2;
const MAX_COMMENT_LENGTH = 280;
const MOCK_COMMUNITY_POST_IDS = new Set([3, 4, 88]);

const MOCK_COMMUNITY_COMMENTS = [
  {
    id: 2,
    author: { nickname: '우림' },
    content: '저도 궁금해요!',
    created_at: '2026-09-03T11:00:00.000Z',
  },
  {
    id: 3,
    author: { nickname: '하루' },
    content: '저는 조용한 카페를 선호해요.',
    created_at: '2026-09-03T10:55:00.000Z',
  },
  {
    id: 4,
    author: { nickname: '루디' },
    content: '판교역 근처 카페를 찾아보고 있어요.',
    created_at: '2026-09-03T10:50:00.000Z',
  },
  {
    id: 5,
    author: { nickname: '모여타' },
    content: '좋은 곳을 찾으면 공유해주세요!',
    created_at: '2026-09-03T10:45:00.000Z',
  },
  {
    id: 6,
    author: { nickname: '길동' },
    content: '주말에도 사람이 많을까요?',
    created_at: '2026-09-03T10:40:00.000Z',
  },
  {
    id: 7,
    author: { nickname: '타요' },
    content: '창가 자리가 있는 곳이면 좋겠네요.',
    created_at: '2026-09-03T10:35:00.000Z',
  },
  {
    id: 8,
    author: { nickname: '제리' },
    content: '판교역 1번 출구 쪽 카페를 추천해요.',
    created_at: '2026-09-03T10:30:00.000Z',
  },
  {
    id: 9,
    author: { nickname: '소다' },
    content: '콘센트가 많은지도 궁금합니다.',
    created_at: '2026-09-03T10:25:00.000Z',
  },
  {
    id: 10,
    author: { nickname: '다온' },
    content: '저도 카페 추천 기다릴게요.',
    created_at: '2026-09-03T10:20:00.000Z',
  },
  {
    id: 11,
    author: { nickname: '온유' },
    content: '조용한 분위기의 카페를 찾고 있어요.',
    created_at: '2026-09-03T10:15:00.000Z',
  },
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function commentValidationError(reason: 'REQUIRED' | 'MAX_LENGTH') {
  return HttpResponse.json(
    {
      message: '입력값을 확인해주세요',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'content',
        details: [{ field: 'content', reason }],
      },
    },
    { status: 400 },
  );
}

function postStatusResponse(
  postId: number,
  notFoundCode: 'POST_NOT_FOUND' | 'NOT_FOUND',
  deletedStatus: 409 | 410,
) {
  if (postId === 89) {
    return errorResponse('삭제된 게시글입니다', 'POST_GONE', null, deletedStatus);
  }

  if (postId === 999) {
    return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
  }

  if (!MOCK_COMMUNITY_POST_IDS.has(postId)) {
    return errorResponse('존재하지 않는 게시글입니다', notFoundCode, null, 404);
  }

  return null;
}

export const communityCommentsHandlers = [
  http.get('*/community-posts/:postId/comments', ({ request, params }) => {
    const postId = Number(params.postId);
    const postError = postStatusResponse(postId, 'POST_NOT_FOUND', 410);

    if (postError) {
      return postError;
    }

    const cursor = new URL(request.url).searchParams.get('cursor');

    if (cursor !== null && cursor !== MOCK_COMMENT_NEXT_CURSOR) {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: cursor === MOCK_COMMENT_NEXT_CURSOR ? [] : MOCK_COMMUNITY_COMMENTS,
        next_cursor: cursor === MOCK_COMMENT_NEXT_CURSOR ? null : MOCK_COMMENT_NEXT_CURSOR,
      },
    });
  }),
  http.post('*/community-posts/:postId/comments', async ({ request, params }) => {
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

    const postId = Number(params.postId);
    const postError = postStatusResponse(postId, 'NOT_FOUND', 409);

    if (postError) {
      return postError;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return commentValidationError('REQUIRED');
    }

    if (!isObject(body) || typeof body.content !== 'string' || body.content.trim() === '') {
      return commentValidationError('REQUIRED');
    }

    if (body.content.length > MAX_COMMENT_LENGTH) {
      return commentValidationError('MAX_LENGTH');
    }

    return HttpResponse.json(
      {
        message: '댓글이 등록되었습니다',
        data: {
          id: MOCK_COMMENT_ID,
          author: { nickname: '우림' },
          content: body.content,
          created_at: '2026-09-03T11:00:00.000Z',
          comment_count: 4,
        },
      },
      {
        status: 201,
        headers: {
          Location: `/api/community-posts/${postId}/comments/${MOCK_COMMENT_ID}`,
        },
      },
    );
  }),
];
