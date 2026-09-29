import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { useTaxiPotMatchingMutation } from '@/features/matching-registration';
import { server } from '@/shared/api/mocks/server';

const payload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('useTaxiPotMatchingMutation', () => {
  it('저장된 access token으로 매칭을 시작한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');

    const { result } = renderHook(() => useTaxiPotMatchingMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual({
      id: 30,
      chat_room_id: 599,
      status: 'RECRUITING',
      current_count: 2,
      capacity: 4,
    });
  });

  it('access token이 없으면 refresh API로 토큰을 발급받아 저장한다', async () => {
    server.use(
      http.post('*/auth/tokens', () =>
        HttpResponse.json({
          message: '토큰이 재발급되었습니다',
          data: { access_token: 'mock-access-token' },
        }),
      ),
    );

    const { result } = renderHook(() => useTaxiPotMatchingMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAuthStore.getState().accessToken).toBe('mock-access-token');
  });

  it('매칭 API 오류를 mutation error로 노출한다', async () => {
    useAuthStore.getState().setAccessToken('invalid-token');

    const { result } = renderHook(() => useTaxiPotMatchingMutation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });
});
