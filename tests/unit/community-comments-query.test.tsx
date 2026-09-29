import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useCommunityPostCommentsQuery } from '@/_pages/post-detail/api/community-posts';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCommunityPostCommentsQuery', () => {
  it('댓글 페이지를 cursor 기반으로 이어서 조회한다', async () => {
    const { result } = renderHook(() => useCommunityPostCommentsQuery(88), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages[1]?.data).toEqual({ items: [], next_cursor: null });
    expect(result.current.hasNextPage).toBe(false);
  });

  it('게시글 ID가 없으면 댓글 조회를 실행하지 않는다', () => {
    const { result } = renderHook(() => useCommunityPostCommentsQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });
});
