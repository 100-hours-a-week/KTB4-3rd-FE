import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { carpoolDetailQueryKeys } from '@/entities/carpool';
import { carpoolRequestQueryKeys } from '@/entities/carpool-request';
import { useCarpoolJoinRequestMutation } from '@/features/carpool-join-request';
import { server } from '@/shared/api/mocks/server';

const viewerId = 27;
const carpoolId = 42;
const token = 'join-request-token';
const payload = { content: '  같이 이동하고 싶습니다.  ' };

function createWrapper(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createQueryClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}

function authenticateAs(viewer: number) {
  useAuthStore.getState().setAccessToken(token);
  useAuthStore.getState().setVerifiedViewerId(token, viewer);
}

afterEach(() => {
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('useCarpoolJoinRequestMutation', () => {
  it('검증된 계정으로 원문을 한 번 보내고 상세 요청과 보낸 요청 목록을 갱신한다', async () => {
    authenticateAs(viewerId);
    const queryClient = createQueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const detailKey = carpoolDetailQueryKeys.detail(carpoolId, viewerId);
    const anotherViewerDetailKey = carpoolDetailQueryKeys.detail(carpoolId, viewerId + 1);
    const anotherViewerDetail = {
      message: '조회',
      data: { id: carpoolId, my_request: undefined },
    };
    queryClient.setQueryData(detailKey, {
      message: '조회',
      data: {
        id: carpoolId,
        my_request: undefined,
      },
    });
    queryClient.setQueryData(anotherViewerDetailKey, anotherViewerDetail);
    let captured: { token: string | null; body: unknown } | undefined;
    let requestCount = 0;
    server.use(
      http.post('*/carpools/:carpoolId/join-requests', async ({ request }) => {
        requestCount += 1;
        captured = {
          token: request.headers.get('authorization'),
          body: await request.json(),
        };
        return HttpResponse.json(
          {
            message: '카풀 요청이 등록되었습니다',
            data: {
              id: 702,
              carpool_id: carpoolId,
              status: 'PENDING',
              created_at: '2026-10-10T00:00:00.000Z',
            },
          },
          { status: 201 },
        );
      }),
    );

    const { result } = renderHook(() => useCarpoolJoinRequestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    result.current.mutate({ viewerId, carpoolId, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(captured).toEqual({ token: `Bearer ${token}`, body: payload });
    expect(requestCount).toBe(1);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['carpools', 'pins'],
      refetchType: 'active',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['carpools', 'nearby'],
      refetchType: 'active',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: carpoolRequestQueryKeys.list(viewerId, 'SENT'),
      refetchType: 'active',
    });
    expect(queryClient.getQueryData(detailKey)).toMatchObject({
      data: { my_request: { id: 702, status: 'PENDING' } },
    });
    expect(queryClient.getQueryData(anotherViewerDetailKey)).toEqual(anotherViewerDetail);
  });

  it('네트워크 결과가 불명확해도 POST를 자동으로 재전송하지 않는다', async () => {
    authenticateAs(viewerId);
    const queryClient = createQueryClient();
    let requestCount = 0;
    server.use(
      http.post('*/carpools/:carpoolId/join-requests', () => {
        requestCount += 1;
        return HttpResponse.error();
      }),
    );

    const { result } = renderHook(() => useCarpoolJoinRequestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    result.current.mutate({ viewerId, carpoolId, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requestCount).toBe(1);
  });

  it('화면에서 전달한 사용자와 로그인한 사용자가 다르면 요청을 보내지 않는다', async () => {
    authenticateAs(viewerId);
    const queryClient = createQueryClient();
    let requestCount = 0;
    server.use(
      http.post('*/carpools/:carpoolId/join-requests', () => {
        requestCount += 1;
        return HttpResponse.json({ message: 'unexpected' }, { status: 201 });
      }),
    );

    const { result } = renderHook(() => useCarpoolJoinRequestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    result.current.mutate({ viewerId: viewerId + 1, carpoolId, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requestCount).toBe(0);
  });

  it('목록 갱신 실패는 이미 성공한 POST를 실패로 바꾸거나 다시 보내지 않는다', async () => {
    authenticateAs(viewerId);
    const queryClient = createQueryClient();
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValue(new Error('cache refresh failed'));
    let requestCount = 0;
    server.use(
      http.post('*/carpools/:carpoolId/join-requests', () => {
        requestCount += 1;
        return HttpResponse.json(
          {
            message: '카풀 요청이 등록되었습니다',
            data: {
              id: 702,
              carpool_id: carpoolId,
              status: 'PENDING',
              created_at: '2026-10-10T00:00:00.000Z',
            },
          },
          { status: 201 },
        );
      }),
    );

    const { result } = renderHook(() => useCarpoolJoinRequestMutation(), {
      wrapper: createWrapper(queryClient),
    });
    result.current.mutate({ viewerId, carpoolId, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestCount).toBe(1);
  });
});
