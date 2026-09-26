import { describe, expect, it } from 'vitest';

type ApiResponse<T> = {
  message: string;
  data: T;
};

type ApiErrorResponse = {
  message: string;
  error: {
    code: string;
    field: string | null;
    details?: { field: string; reason: string }[];
  };
};

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe('커뮤니티 댓글 MSW mock API', () => {
  it('댓글 목록과 다음 cursor를 반환한다', async () => {
    const response = await fetch('http://localhost:8080/community-posts/88/comments');
    const body = await readJson<
      ApiResponse<{
        items: { id: number; author: { nickname: string }; content: string; created_at: string }[];
        next_cursor: string | null;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body.message).toBe('조회에 성공했습니다');
    expect(body.data.items).toHaveLength(10);
    expect(body.data.items[0]).toEqual({
      id: 2,
      author: { nickname: '우림' },
      content: '저도 궁금해요!',
      created_at: '2026-09-03T11:00:00.000Z',
    });
    expect(body.data.next_cursor).toBe('v1.eyJsYXN0X2lkIjoxfQ');
  });

  it('다음 cursor를 전달하면 마지막 페이지를 반환한다', async () => {
    const response = await fetch(
      'http://localhost:8080/community-posts/88/comments?cursor=v1.eyJsYXN0X2lkIjoxfQ',
    );
    const body =
      await readJson<ApiResponse<{ items: unknown[]; next_cursor: string | null }>>(response);

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ items: [], next_cursor: null });
  });

  it('잘못된 cursor를 거부한다', async () => {
    const response = await fetch(
      'http://localhost:8080/community-posts/88/comments?cursor=invalid',
    );
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: '잘못된 커서입니다',
      error: { code: 'INVALID_CURSOR', field: null },
    });
  });

  it.each([
    [90, 404, 'POST_NOT_FOUND'],
    [89, 410, 'POST_GONE'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('댓글 목록 조회 시 게시글 오류를 반환한다', async (postId, status, code) => {
    const response = await fetch(`http://localhost:8080/community-posts/${postId}/comments`);
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(status);
    expect(body.error).toEqual({ code, field: null });
  });

  it('댓글을 작성하고 Location을 반환한다', async () => {
    const response = await fetch('http://localhost:8080/community-posts/88/comments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '저도 궁금해요!' }),
    });
    const body = await readJson<
      ApiResponse<{
        id: number;
        author: { nickname: string };
        content: string;
        created_at: string;
        comment_count: number;
      }>
    >(response);

    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe('/api/community-posts/88/comments/2');
    expect(body).toEqual({
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

  it('인증 토큰이 없거나 유효하지 않으면 작성을 거부한다', async () => {
    const response = await fetch('http://localhost:8080/community-posts/88/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '댓글' }),
    });
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
    expect(body).toEqual({
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    });
  });

  it.each([
    [{}, 'REQUIRED'],
    [{ content: '   ' }, 'REQUIRED'],
    [{ content: 'a'.repeat(281) }, 'MAX_LENGTH'],
  ])('댓글 내용 검증 오류를 반환한다', async (payload, reason) => {
    const response = await fetch('http://localhost:8080/community-posts/88/comments', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(400);
    expect(body.error).toEqual({
      code: 'VALIDATION_ERROR',
      field: 'content',
      details: [{ field: 'content', reason }],
    });
  });

  it.each([
    [90, 404, 'NOT_FOUND'],
    [89, 409, 'POST_GONE'],
    [999, 500, 'INTERNAL_SERVER_ERROR'],
  ])('댓글 작성 시 게시글 오류를 반환한다', async (postId, status, code) => {
    const response = await fetch(`http://localhost:8080/community-posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '댓글' }),
    });
    const body = await readJson<ApiErrorResponse>(response);

    expect(response.status).toBe(status);
    expect(body.error).toEqual({ code, field: null });
  });
});
