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
});
