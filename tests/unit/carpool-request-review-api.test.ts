import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCarpoolRequestDetail } from '@/features/carpool-request-review';
import { server } from '@/shared/api/mocks/server';

afterEach(() => server.resetHandlers());

describe('카풀 요청 상세 API', () => {
  it('두 ID와 access token으로 상세를 조회하고 서버 응답을 반환한다', async () => {
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

    const response = await getCarpoolRequestDetail('mock-access-token', 51, 88);
    const request = requested.mock.calls[0][0];

    expect(new URL(request.url).pathname).toMatch(/\/carpools\/51\/join-requests\/88$/);
    expect(request.headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(response.data).toMatchObject({ id: 88, carpool_id: 51, status: 'PENDING' });
  });

  it('인증 정보가 없으면 Bearer 인증 안내를 포함한 401 오류를 반환한다', async () => {
    await expect(getCarpoolRequestDetail('', 51, 88)).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      message: '로그인이 필요합니다',
    });
  });

  it('모집자가 아니면 HOST_ONLY 오류를 반환한다', async () => {
    await expect(getCarpoolRequestDetail('mock-access-token', 403, 88)).rejects.toMatchObject({
      status: 403,
      code: 'HOST_ONLY',
      message: '카풀 등록자만 처리할 수 있습니다',
    });
  });

  it.each([
    [404, 88, 'CARPOOL_NOT_FOUND', '존재하지 않는 카풀입니다'],
    [51, 404, 'CARPOOL_REQUEST_NOT_FOUND', '존재하지 않는 카풀 요청입니다'],
  ])(
    '카풀 또는 요청이 없으면 해당 404 오류를 반환한다',
    async (carpoolId, requestId, code, message) => {
      await expect(
        getCarpoolRequestDetail('mock-access-token', carpoolId, requestId),
      ).rejects.toMatchObject({ status: 404, code, message });
    },
  );

  it('서버 오류는 재시도 가능한 500 API 오류로 반환한다', async () => {
    await expect(getCarpoolRequestDetail('mock-access-token', 500, 88)).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다',
    });
  });
});
