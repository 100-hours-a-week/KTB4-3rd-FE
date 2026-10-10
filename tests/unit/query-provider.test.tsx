import { useQuery } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { QueryProvider } from '@/_app/providers';
import { ApiError } from '@/shared/api/client';

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryProvider>{children}</QueryProvider>;
  };
}

describe('QueryProvider 기본 재시도 정책', () => {
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
