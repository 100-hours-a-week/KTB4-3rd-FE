import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/client';
import { server } from '@/shared/api/mocks/server';
import { createCarpoolJoinRequest } from '@/features/carpool-join-request';

describe('carpool join request API', () => {
  it('인증 토큰, 정확한 경로, 원문 content로 요청한다', async () => {
    const content = '  참여하고 싶습니다\n시간 맞춰 갈게요  ';
    const apiBasePath = new URL(
      process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
      'http://localhost',
    ).pathname.replace(/\/$/, '');
    let captured: { authorization: string | null; url: string; body: unknown } | undefined;

    server.use(
      http.post('*/carpools/:companionId/join-requests', async ({ request }) => {
        captured = {
          authorization: request.headers.get('authorization'),
          url: new URL(request.url).pathname,
          body: await request.json(),
        };

        return HttpResponse.json({ message: '요청 완료', data: { id: 12 } }, { status: 201 });
      }),
    );

    await createCarpoolJoinRequest('test-token', 42, { content });

    expect(captured).toEqual({
      authorization: 'Bearer test-token',
      url: `${apiBasePath}/carpools/42/join-requests`,
      body: { content },
    });
  });

  it('201 응답의 참여 요청 정보를 반환한다', async () => {
    await expect(
      createCarpoolJoinRequest('mock-access-token', 1, { content: '같이 이동하고 싶어요' }),
    ).resolves.toEqual({
      message: '카풀 요청이 등록되었습니다',
      data: {
        id: 702,
        carpool_id: 1,
        status: 'PENDING',
        created_at: '2026-10-10T00:00:00.000Z',
      },
    });
  });

  it('전달된 AbortSignal로 요청을 취소할 수 있다', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      createCarpoolJoinRequest(
        'mock-access-token',
        1,
        { content: '같이 이동하고 싶어요' },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('등록된 mock 응답은 Location 헤더에 새 요청 경로를 담는다', async () => {
    const response = await fetch('/api/carpools/1/join-requests', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '같이 이동하고 싶어요' }),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('Location')).toBe('/carpools/1/join-requests/702');
    await expect(response.json()).resolves.toMatchObject({ message: '카풀 요청이 등록되었습니다' });
  });

  it('401 응답은 Bearer 인증 헤더와 명세 문구를 반환한다', async () => {
    const response = await fetch('/api/carpools/1/join-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '참여 요청' }),
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
    await expect(response.json()).resolves.toMatchObject({ message: '로그인이 필요합니다' });
  });

  it.each([
    [2, '이미 요청을 보낸 상태입니다'],
    [3, '카풀 정원이 가득 찼습니다'],
    [4, '마감된 카풀입니다'],
    [5, '이미 참여 중인 카풀입니다'],
    [6, '제한된 요청 수를 초과했습니다'],
  ])('409 카풀 오류 %i는 명세 문구를 반환한다', async (carpoolId, message) => {
    const response = await fetch(`/api/carpools/${carpoolId}/join-requests`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '참여 요청' }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ message });
  });

  it('존재하지 않는 카풀과 본인이 등록한 카풀의 명세 문구를 반환한다', async () => {
    const notFoundResponse = await fetch('/api/carpools/404/join-requests', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '참여 요청' }),
    });
    expect(notFoundResponse.status).toBe(404);
    await expect(notFoundResponse.json()).resolves.toMatchObject({
      message: '존재하지 않는 카풀입니다',
    });

    const ownCarpoolResponse = await fetch('/api/carpools/7/join-requests', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '참여 요청' }),
    });
    expect(ownCarpoolResponse.status).toBe(422);
    await expect(ownCarpoolResponse.json()).resolves.toMatchObject({
      message: '본인이 등록한 카풀에는 동승 요청을 보낼 수 없습니다',
    });
  });

  it('문서화된 오류를 현재 ApiError의 상태, 코드, 필드로 변환한다', async () => {
    await expect(
      createCarpoolJoinRequest('invalid-token', 1, { content: '참여 요청' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      createCarpoolJoinRequest('invalid-token', 1, { content: '참여 요청' }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED', field: null });

    await expect(
      createCarpoolJoinRequest('mock-access-token', 2, { content: '참여 요청' }),
    ).rejects.toMatchObject({ status: 409, code: 'REQUEST_ALREADY_PENDING', field: null });
  });

  it('200자를 초과한 메시지는 문서화된 길이 오류로 응답한다', async () => {
    await expect(
      createCarpoolJoinRequest('mock-access-token', 1, { content: '가'.repeat(201) }),
    ).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR', field: 'content' });

    const response = await fetch('/api/carpools/1/join-requests', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-access-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '가'.repeat(201) }),
    });

    await expect(response.json()).resolves.toMatchObject({
      error: {
        details: [{ field: 'content', reason: 'LENGTH_OUT_OF_RANGE' }],
      },
    });
  });
});
