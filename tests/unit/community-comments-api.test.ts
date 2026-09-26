import { describe, expect, it } from 'vitest';

import { getCommunityPostComments } from '@/_pages/post-detail/api/community-posts';
import {
  createCommunityPostComment,
  type CreateCommunityPostCommentResponse,
} from '@/features/post-comment';

describe('community comments API', () => {
  it('첫 번째 댓글 페이지를 조회한다', async () => {
    const response = await getCommunityPostComments(88);

    expect(response).toEqual({
      message: '조회에 성공했습니다',
      data: {
        items: expect.arrayContaining([
          {
            id: 2,
            author: { nickname: '우림' },
            content: '저도 궁금해요!',
            created_at: '2026-09-03T11:00:00.000Z',
          },
        ]),
        next_cursor: 'v1.eyJsYXN0X2lkIjoxfQ',
      },
    });
    expect(response.data.items).toHaveLength(10);
  });

  it('cursor를 전달해 다음 댓글 페이지를 조회한다', async () => {
    const response = await getCommunityPostComments(88, 'v1.eyJsYXN0X2lkIjoxfQ');

    expect(response.data).toEqual({ items: [], next_cursor: null });
  });

  it.each([
    [89, 410, 'POST_GONE'],
    [90, 404, 'POST_NOT_FOUND'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('댓글 목록 조회 오류를 ApiError로 변환한다', async (postId, status, code) => {
    await expect(getCommunityPostComments(postId)).rejects.toMatchObject({ status, code });
  });

  it('인증 토큰과 함께 댓글을 작성한다', async () => {
    const response = await createCommunityPostComment('mock-access-token', 88, {
      content: '저도 궁금해요!',
    });

    expect(response).toEqual<CreateCommunityPostCommentResponse>({
      message: '댓글이 등록되었습니다',
      data: {
        id: 2,
        author: { nickname: '우림' },
        content: '저도 궁금해요!',
        created_at: '2026-09-03T11:00:00.000Z',
        comment_count: 4,
      },
    });
  });

  it('인증 토큰이 유효하지 않으면 댓글 작성을 거부한다', async () => {
    await expect(
      createCommunityPostComment('invalid-token', 88, { content: '댓글' }),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      field: null,
    });
  });

  it.each([
    [90, 404, 'NOT_FOUND'],
    [89, 409, 'POST_GONE'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('댓글 작성 오류를 ApiError로 변환한다', async (postId, status, code) => {
    await expect(
      createCommunityPostComment('mock-access-token', postId, { content: '댓글' }),
    ).rejects.toMatchObject({ status, code });
  });
});
