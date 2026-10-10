import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { decideCarpoolRequest, getCarpoolRequestDetail } from '@/features/carpool-request-review';
import { server } from '@/shared/api/mocks/server';

const accessToken = 'mock-access-token';

afterEach(() => {
  server.resetHandlers();
});

describe('카풀 요청 상세·처리 API', () => {
  it('두 ID로 상세를 조회하고 서버의 요청 데이터를 반환한다', async () => {
    const requested = vi.fn<(request: Request) => void>();
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ request }) => {
        requested(request.clone());
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 88,
            carpool_id: 51,
            status: 'PENDING',
            content: '같이 가고 싶습니다',
            requester: { id: 9, name: '이루디', profile_image_url: null },
            created_at: '2026-10-10T08:10:00.000Z',
          },
        });
      }),
    );

    const response = await getCarpoolRequestDetail(accessToken, 51, 88);
    const request = requested.mock.calls[0][0];

    expect(new URL(request.url).pathname).toBe('/carpools/51/join-requests/88');
    expect(request.headers.get('authorization')).toBe(`Bearer ${accessToken}`);
    expect(response.data).toMatchObject({ id: 88, carpool_id: 51, status: 'PENDING' });
  });

  it.each(['ACCEPTED', 'REJECTED'] as const)(
    '%s 상태만 body에 담아 지정한 요청의 상태를 변경한다',
    async (status) => {
      const received = vi.fn<(request: Request) => void>();
      server.use(
        http.patch('*/carpools/:carpoolId/join-requests/:requestId', async ({ request }) => {
          received(request.clone());
          return HttpResponse.json({
            message: '요청을 처리했습니다',
            data: { id: 88, status },
          });
        }),
      );

      const response = await decideCarpoolRequest(accessToken, 51, 88, status);
      const request = received.mock.calls[0][0];

      expect(new URL(request.url).pathname).toBe('/carpools/51/join-requests/88');
      expect(request.method).toBe('PATCH');
      expect(await request.json()).toEqual({ status });
      expect(response.data).toMatchObject({ id: 88, status });
    },
  );

  it('서버의 정원 오류를 ApiError로 보존한다', async () => {
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () =>
        HttpResponse.json(
          { message: '카풀 정원이 가득 찼습니다', error: { code: 'CAPACITY_FULL', field: null } },
          { status: 409 },
        ),
      ),
    );

    await expect(decideCarpoolRequest(accessToken, 51, 88, 'ACCEPTED')).rejects.toMatchObject({
      status: 409,
      code: 'CAPACITY_FULL',
    });
  });
});
