import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { CarpoolRequestAuthCacheSync } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/entities/carpool-request';

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CarpoolRequestAuthCacheSync />
        {children}
      </QueryClientProvider>
    );
  };
}

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
});

describe('카풀 요청 계정 전환 캐시 정리', () => {
  it('이전 사용자의 진행 중인 조회를 취소·삭제하고 늦게 끝난 응답도 저장하지 않는다', async () => {
    useAuthStore.getState().setAccessToken('account-a-token');
    useAuthStore.getState().setVerifiedViewerId('account-a-token', 7);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<span />, { wrapper: createWrapper(queryClient) });

    let resolveRequest!: (value: { owner: number }) => void;
    let requestSignal: AbortSignal | undefined;
    const oldViewerKey = carpoolRequestQueryKeys.detail(7, 51, 90);
    const pendingRequest = new Promise<{ owner: number }>((resolve) => {
      resolveRequest = resolve;
    });
    void queryClient
      .fetchQuery({
        queryKey: oldViewerKey,
        queryFn: ({ signal }) => {
          requestSignal = signal;
          return pendingRequest;
        },
      })
      .catch(() => undefined);

    await act(async () => {
      useAuthStore.getState().setAccessToken('account-b-token');
      useAuthStore.getState().setVerifiedViewerId('account-b-token', 8);
    });

    expect(requestSignal?.aborted).toBe(true);
    expect(queryClient.getQueryState(oldViewerKey)).toBeUndefined();

    resolveRequest({ owner: 7 });
    await act(async () => {
      await pendingRequest;
    });

    expect(queryClient.getQueryState(oldViewerKey)).toBeUndefined();
    expect(queryClient.getQueryData(oldViewerKey)).toBeUndefined();
    queryClient.clear();
  });

  it('로그아웃하면 진행 중이 아닌 이전 사용자의 요청 상세 캐시도 제거한다', () => {
    useAuthStore.getState().setAccessToken('account-a-token');
    useAuthStore.getState().setVerifiedViewerId('account-a-token', 7);

    const queryClient = new QueryClient();
    const oldViewerKey = carpoolRequestQueryKeys.detail(7, 51, 90);
    queryClient.setQueryData(oldViewerKey, { owner: 7 });
    render(<span />, { wrapper: createWrapper(queryClient) });

    act(() => useAuthStore.getState().clearTokens());

    expect(queryClient.getQueryState(oldViewerKey)).toBeUndefined();
    queryClient.clear();
  });
});
