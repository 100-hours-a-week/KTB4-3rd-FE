import { type QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { carpoolDetailQueryKeys } from '@/entities/carpool';
import { ApiError } from '@/shared/api/client';

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryProvider>{children}</QueryProvider>;
  };
}

describe('QueryProvider 기본 재시도 정책', () => {
  it('계정 전환 시 이전 사용자의 카풀 상세 캐시를 제거한다', async () => {
    let queryClient: QueryClient | undefined;
    function CacheProbe() {
      const client = useQueryClient();
      useEffect(() => {
        queryClient = client;
      }, [client]);
      return null;
    }
    useAuthStore.getState().setAccessToken('old-token');
    useAuthStore.getState().setVerifiedViewerId('old-token', 7);
    const key = carpoolDetailQueryKeys.detail(51, 7);

    render(
      <QueryProvider>
        <CacheProbe />
      </QueryProvider>,
    );
    await waitFor(() => expect(queryClient).toBeDefined());
    const client = queryClient;
    if (!client) {
      throw new Error('QueryClient가 준비되지 않았습니다.');
    }
    client.setQueryData(key, { message: '조회', data: { id: 51 } });

    act(() => useAuthStore.getState().setAccessToken('new-token'));

    await waitFor(() => expect(client.getQueryData(key)).toBeUndefined());
    useAuthStore.getState().clearTokens();
  });

  it('네트워크 오류를 한 번 재시도한다', async () => {
    const queryFn = vi
      .fn<() => Promise<never>>()
      .mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useQuery({ queryKey: ['network-retry'], queryFn }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5_000 });

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('4xx 응답은 재시도하지 않는다', async () => {
    const queryFn = vi.fn<() => Promise<never>>().mockRejectedValue(new ApiError(422));
    const { result } = renderHook(() => useQuery({ queryKey: ['validation-error'], queryFn }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryFn).toHaveBeenCalledOnce();
  });
});
