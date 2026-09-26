import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import {
  useCreateCommunityPostCommentMutation,
  type CreateCommunityPostCommentVariables,
} from '@/features/post-comment';

const variables: CreateCommunityPostCommentVariables = {
  postId: 88,
  payload: { content: '저도 궁금해요!' },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('useCreateCommunityPostCommentMutation', () => {
  it('저장된 access token으로 댓글을 작성한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');

    const { result } = renderHook(() => useCreateCommunityPostCommentMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(variables);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.comment_count).toBe(4);
  });

  it('access token이 없으면 refresh API로 토큰을 발급받아 저장한다', async () => {
    const { result } = renderHook(() => useCreateCommunityPostCommentMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(variables);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useAuthStore.getState().accessToken).toBe('mock-access-token');
  });

  it('댓글 작성 API 오류를 mutation error로 노출한다', async () => {
    useAuthStore.getState().setAccessToken('invalid-token');

    const { result } = renderHook(() => useCreateCommunityPostCommentMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(variables);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
