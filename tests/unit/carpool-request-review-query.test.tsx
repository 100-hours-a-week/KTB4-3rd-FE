import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

import {
  carpoolRequestDecisionMutationKeys,
  carpoolRequestReviewQueries,
  useCarpoolRequestDecisionMutation,
} from '@/features/carpool-request-review';
import { useAuthStore } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/shared/api/carpool-request-query-keys';
import { server } from '@/shared/api/mocks/server';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
});

describe('카풀 요청 상세·처리 query', () => {
  it('상세 캐시를 사용자, 카풀, 요청 ID 조합으로 나눈다', () => {
    const query = (viewerId: number, carpoolId: number, requestId: number) =>
      carpoolRequestReviewQueries.detail({
        viewerId,
        carpoolId,
        requestId,
        enabled: true,
      }).queryKey;

    expect(query(7, 51, 88)).not.toEqual(query(8, 51, 88));
    expect(query(7, 51, 88)).not.toEqual(query(7, 52, 88));
    expect(query(7, 51, 88)).not.toEqual(query(7, 51, 89));
    expect(
      carpoolRequestReviewQueries.detail({
        viewerId: null,
        carpoolId: 51,
        requestId: 88,
        enabled: true,
      }).enabled,
    ).toBe(false);
  });

  it('수락 성공 시 받은 요청을 제거하고 확정 상태만 상세에 반영한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: true }, queries: { retry: false } },
    });
    const receivedKey = carpoolRequestQueryKeys.list(7, 'RECEIVED');
    const sentKey = carpoolRequestQueryKeys.list(7, 'SENT');
    const detailKey = carpoolRequestQueryKeys.detail(7, 51, 88);
    queryClient.setQueryData(receivedKey, {
      pages: [
        {
          data: {
            direction: 'RECEIVED',
            items: [{ id: 88 }, { id: 90 }],
            next_cursor: 'next',
          },
        },
      ],
      pageParams: [undefined],
    });
    queryClient.setQueryData(sentKey, {
      pages: [{ data: { direction: 'SENT', items: [{ id: 88 }], next_cursor: null } }],
      pageParams: [undefined],
    });
    queryClient.setQueryData(detailKey, {
      message: '조회에 성공했습니다',
      data: {
        id: 88,
        carpool_id: 51,
        status: 'PENDING',
        content: '함께 가고 싶습니다',
        requester: { id: 9, name: '이루디', profile_image_url: null },
        created_at: '2026-10-10T08:10:00.000Z',
      },
    });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
        requestCount();
        return HttpResponse.json({
          message: '요청을 수락했습니다',
          data: { id: 88, status: 'ACCEPTED', chat_room_id: 620, current_count: 2, capacity: 4 },
        });
      }),
    );
    const { result } = renderHook(() => useCarpoolRequestDecisionMutation(7), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync({
      viewerId: 7,
      carpoolId: 51,
      requestId: 88,
      status: 'ACCEPTED',
    });

    expect(requestCount).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(receivedKey)).toMatchObject({
      pages: [{ data: { items: [{ id: 90 }], next_cursor: 'next' } }],
    });
    expect(queryClient.getQueryData(sentKey)).toMatchObject({
      pages: [{ data: { items: [{ id: 88 }] } }],
    });
    expect(queryClient.getQueryData(detailKey)).toMatchObject({ data: { status: 'ACCEPTED' } });
    expect(queryClient.getQueryState(receivedKey)?.isInvalidated).toBe(true);
    expect(queryClient.getMutationCache().getAll()[0]?.options.mutationKey).toEqual(
      carpoolRequestDecisionMutationKeys.decide(7),
    );
  });

  it('PATCH 실패는 자동 재전송하지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: true } } });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.patch('*/carpools/:carpoolId/join-requests/:requestId', () => {
        requestCount();
        return HttpResponse.json(
          { message: '서버 오류가 발생했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );
    const { result } = renderHook(() => useCarpoolRequestDecisionMutation(7), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      result.current.mutateAsync({
        viewerId: 7,
        carpoolId: 51,
        requestId: 88,
        status: 'REJECTED',
      }),
    ).rejects.toMatchObject({ status: 500 });

    await waitFor(() => expect(requestCount).toHaveBeenCalledTimes(1));
  });
});
