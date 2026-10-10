import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/client';
import { server } from '@/shared/api/mocks/server';
import { createCarpoolJoinRequest } from '@/features/carpool-join-request';

describe('carpool join request API', () => {
  it('인증 토큰, 정확한 경로, 원문 content로 요청한다', async () => {
    const content = '  참여하고 싶습니다\n시간 맞춰 갈게요  ';
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
      url: '/carpools/42/join-requests',
      body: { content },
    });
  });

  it('201 응답의 참여 요청 정보를 반환한다', async () => {
    await expect(
      createCarpoolJoinRequest('mock-access-token', 1, { content: '같이 이동하고 싶어요' }),
    ).resolves.toEqual({
      message: '참여 요청을 보냈습니다',
      data: {
        id: 702,
        carpool_id: 1,
        status: 'PENDING',
        created_at: '2026-10-10T00:00:00.000Z',
      },
    });
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
