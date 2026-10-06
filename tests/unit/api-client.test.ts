import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { apiFetch } from '@/shared/api/client';
import { server } from '@/shared/api/mocks/server';

const EXPIRED_ACCESS_TOKEN = 'expired-access-token';
const REFRESHED_ACCESS_TOKEN = 'refreshed-access-token';

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    },
    { status: 401 },
  );
}

afterEach(() => {
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('apiFetch 인증 토큰 재시도', () => {
  it('401 응답 후 토큰을 재발급받아 원래 요청을 한 번 재시도한다', async () => {
    const authorizationHeaders: string[] = [];
    const requestBodies: { content: string }[] = [];
    let protectedRequestCount = 0;
    let refreshRequestCount = 0;

    server.use(
      http.post('*/protected-resource', async ({ request }) => {
        protectedRequestCount += 1;
        authorizationHeaders.push(request.headers.get('authorization') ?? '');
        requestBodies.push((await request.json()) as { content: string });

        if (request.headers.get('authorization') !== `Bearer ${REFRESHED_ACCESS_TOKEN}`) {
          return unauthorizedResponse();
        }

        return HttpResponse.json({ message: '성공', data: { id: 1 } });
      }),
      http.post('*/auth/tokens', () => {
        refreshRequestCount += 1;

        return HttpResponse.json({
          message: '토큰이 재발급되었습니다',
          data: { access_token: REFRESHED_ACCESS_TOKEN },
        });
      }),
    );

    useAuthStore.getState().setAccessToken(EXPIRED_ACCESS_TOKEN);

    const response = await apiFetch<{ data: { id: number } }>('/protected-resource', {
      method: 'POST',
      token: EXPIRED_ACCESS_TOKEN,
      body: JSON.stringify({ content: '재시도 요청' }),
    });

    expect(response.data.id).toBe(1);
    expect(protectedRequestCount).toBe(2);
    expect(refreshRequestCount).toBe(1);
    expect(authorizationHeaders).toEqual([
      `Bearer ${EXPIRED_ACCESS_TOKEN}`,
      `Bearer ${REFRESHED_ACCESS_TOKEN}`,
    ]);
    expect(requestBodies).toEqual([{ content: '재시도 요청' }, { content: '재시도 요청' }]);
    expect(useAuthStore.getState().accessToken).toBe(REFRESHED_ACCESS_TOKEN);
  });

  it('동시에 만료된 요청은 하나의 토큰 재발급 요청을 공유한다', async () => {
    let protectedRequestCount = 0;
    let refreshRequestCount = 0;
    let releaseRefresh: () => void = () => undefined;
    let markRefreshStarted: () => void = () => undefined;
    let markInitialRequestsFinished: () => void = () => undefined;

    const refreshStarted = new Promise<void>((resolve) => {
      markRefreshStarted = resolve;
    });
    const initialRequestsFinished = new Promise<void>((resolve) => {
      markInitialRequestsFinished = resolve;
    });
    const refreshReleased = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    const handleProtectedRequest = ({ request }: { request: Request }) => {
      protectedRequestCount += 1;

      if (protectedRequestCount === 2) {
        markInitialRequestsFinished();
      }

      if (request.headers.get('authorization') !== `Bearer ${REFRESHED_ACCESS_TOKEN}`) {
        return unauthorizedResponse();
      }

      return HttpResponse.json({ message: '성공', data: { id: 1 } });
    };

    server.use(
      http.get('*/protected-resource-a', handleProtectedRequest),
      http.get('*/protected-resource-b', handleProtectedRequest),
      http.post('*/auth/tokens', async () => {
        refreshRequestCount += 1;
        markRefreshStarted();
        await refreshReleased;

        return HttpResponse.json({
          message: '토큰이 재발급되었습니다',
          data: { access_token: REFRESHED_ACCESS_TOKEN },
        });
      }),
    );

    useAuthStore.getState().setAccessToken(EXPIRED_ACCESS_TOKEN);

    const firstRequest = apiFetch<{ data: { id: number } }>('/protected-resource-a', {
      token: EXPIRED_ACCESS_TOKEN,
    });
    const secondRequest = apiFetch<{ data: { id: number } }>('/protected-resource-b', {
      token: EXPIRED_ACCESS_TOKEN,
    });

    await Promise.all([refreshStarted, initialRequestsFinished]);
    expect(refreshRequestCount).toBe(1);

    releaseRefresh();

    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);

    expect(firstResponse.data.id).toBe(1);
    expect(secondResponse.data.id).toBe(1);
    expect(refreshRequestCount).toBe(1);
  });

  it('refresh 요청이 401이면 재귀하지 않고 원래 요청을 재시도하지 않는다', async () => {
    let protectedRequestCount = 0;
    let refreshRequestCount = 0;

    server.use(
      http.get('*/protected-resource', () => {
        protectedRequestCount += 1;
        return unauthorizedResponse();
      }),
      http.post('*/auth/tokens', () => {
        refreshRequestCount += 1;
        return unauthorizedResponse();
      }),
    );

    useAuthStore.getState().setAccessToken(EXPIRED_ACCESS_TOKEN);

    await expect(
      apiFetch('/protected-resource', { token: EXPIRED_ACCESS_TOKEN }),
    ).rejects.toMatchObject({ status: 401 });

    expect(protectedRequestCount).toBe(1);
    expect(refreshRequestCount).toBe(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
