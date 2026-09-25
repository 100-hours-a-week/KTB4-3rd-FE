import { describe, expect, it } from 'vitest';

import { getCommunityPostDetail } from '@/_pages/post-detail/api/community-posts';

describe('community post detail API', () => {
  it('커뮤니티 게시글 상세를 조회한다', async () => {
    const response = await getCommunityPostDetail(88);

    expect(response.data).toEqual({
      id: 88,
      title: '판교역 근처 카페 추천',
      content: '조용히 작업하기 좋은 카페가 있을까요?',
      author: { nickname: '루디' },
      comment_count: 3,
      created_at: '2026-09-03T10:00:00.000Z',
    });
  });

  it.each([
    [89, 410, 'GONE'],
    [90, 404, 'POST_NOT_FOUND'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('API 오류 응답을 상태와 코드로 변환한다', async (postId, status, code) => {
    await expect(getCommunityPostDetail(postId)).rejects.toMatchObject({
      status,
      code,
    });
  });
});
