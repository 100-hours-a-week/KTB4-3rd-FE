import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { carpoolRequestReviewQueries } from '@/features/carpool-request-review';
import { useAuthStore } from '@/entities/auth';
import { ApiError } from '@/shared/api/client';
import { userProfileQueries } from '@/features/user-profile';
import { server } from '@/shared/api/mocks/server';

const detail = {
  message: '조회에 성공했습니다',
  data: {
    id: 88,
    carpool_id: 51,
    status: 'PENDING',
    content: '같이 가고 싶습니다',
    requester: { id: 9, name: '이루디', profile_image_url: null },
    created_at: '2026-10-10T08:10:00.000Z',
  },
};

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
  useAuthStore.getState().setVerifiedViewerId('mock-access-token', 7);
});

afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
});

describe('카풀 요청 상세 query', () => {
  it('오프라인에서도 실행하며 창 포커스 복귀 시 최신 상세를 다시 확인한다', () => {
    const query = carpoolRequestReviewQueries.detail({
      viewerId: 7,
      carpoolId: 51,
      requestId: 88,
      enabled: true,
    });

    expect(query.networkMode).toBe('always');
    expect(query.refetchOnWindowFocus).toBe(true);
  });

  it('권한·대상 오류는 다시 요청하지 않고 서버·네트워크 오류는 한 번 재시도한다', () => {
    const retry = carpoolRequestReviewQueries.detail({
      viewerId: 7,
      carpoolId: 51,
      requestId: 88,
      enabled: true,
    }).retry;

    expect(typeof retry).toBe('function');
    if (typeof retry !== 'function') {
      throw new Error('retry 정책이 함수여야 합니다.');
    }

    expect(retry(0, new ApiError(403, { error: { code: 'HOST_ONLY' } }))).toBe(false);
    expect(retry(0, new ApiError(404, { error: { code: 'CARPOOL_NOT_FOUND' } }))).toBe(false);
    expect(retry(0, new ApiError(500, { error: { code: 'INTERNAL_SERVER_ERROR' } }))).toBe(true);
    expect(retry(1, new ApiError(500, { error: { code: 'INTERNAL_SERVER_ERROR' } }))).toBe(false);
    expect(retry(0, new TypeError('network error'))).toBe(true);
  });

  it('상세 캐시를 사용자, 카풀, 요청 ID 조합으로 나누고 대상 정보가 없으면 비활성화한다', () => {
    const key = (viewerId: number, carpoolId: number, requestId: number) =>
      carpoolRequestReviewQueries.detail({ viewerId, carpoolId, requestId, enabled: true })
        .queryKey;

    expect(key(7, 51, 88)).not.toEqual(key(8, 51, 88));
    expect(key(7, 51, 88)).not.toEqual(key(7, 52, 88));
    expect(key(7, 51, 88)).not.toEqual(key(7, 51, 89));
    expect(
      carpoolRequestReviewQueries.detail({
        viewerId: null,
        carpoolId: 51,
        requestId: 88,
        enabled: true,
      }).enabled,
    ).toBe(false);
  });

  it('지정한 카풀·요청 endpoint를 현재 검증된 viewer 토큰으로 조회한다', async () => {
    const requested = vi.fn<(request: Request) => void>();
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', ({ request }) => {
        requested(request.clone());
        return HttpResponse.json(detail);
      }),
    );

    const response = await new QueryClient().fetchQuery(
      carpoolRequestReviewQueries.detail({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        enabled: true,
      }),
    );
    const request = requested.mock.calls[0][0];

    expect(new URL(request.url).pathname).toMatch(/\/carpools\/51\/join-requests\/88$/);
    expect(request.headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(response.data).toMatchObject({ id: 88, carpool_id: 51, status: 'PENDING' });
  });

  it('현재 사용자 응답으로 access token에 연결된 viewerId를 검증한다', async () => {
    useAuthStore.getState().setVerifiedViewerId('mock-access-token', 999);
    server.use(
      http.get('*/users/me', () =>
        HttpResponse.json({
          message: '내 정보 조회에 성공했습니다',
          data: { id: 7, name: '이루디', profile_image_url: null, email: 'rudi@example.com' },
        }),
      ),
    );

    await new QueryClient().fetchQuery(userProfileQueries.current());

    expect(useAuthStore.getState().verifiedViewerId).toBe(7);
  });

  it('현재 인증 사용자와 viewerId가 다르면 상세 요청을 보내지 않는다', async () => {
    const requestCount = vi.fn<() => void>();
    server.use(
      http.get('*/carpools/:carpoolId/join-requests/:requestId', () => {
        requestCount();
        return HttpResponse.json(detail);
      }),
    );

    await expect(
      new QueryClient().fetchQuery(
        carpoolRequestReviewQueries.detail({
          viewerId: 8,
          carpoolId: 51,
          requestId: 88,
          enabled: true,
        }),
      ),
    ).rejects.toThrow('현재 로그인한 사용자 정보를 확인할 수 없습니다.');
    expect(requestCount).not.toHaveBeenCalled();
  });
});
