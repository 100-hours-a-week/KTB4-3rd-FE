import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { registerOwnedCar, type OwnedCarRegistrationPayload } from '@/entities/owned-car';
import { useOwnedCarRegistrationMutation } from '@/features/owned-car-registration';
import { server } from '@/shared/api/mocks/server';

const payload: OwnedCarRegistrationPayload = {
  number: '12가3456',
  model: '승용차',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: true } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
});

describe('보유 차량 등록 API', () => {
  it('백엔드 계약의 요청 경로, 인증 헤더와 payload를 전달하고 응답을 보존한다', async () => {
    const received = vi.fn<(request: Request) => void>();
    server.use(
      http.post('*/users/me/cars', async ({ request }) => {
        received(request.clone());
        return HttpResponse.json(
          { message: '차량 등록 성공', data: { id: 12, createdAt: '2026-10-11T05:00:00' } },
          { status: 201 },
        );
      }),
    );

    const response = await registerOwnedCar('mock-access-token', payload);
    const request = received.mock.calls[0][0];

    expect(request.method).toBe('POST');
    expect(request.headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(await request.json()).toEqual(payload);
    expect(response.data).toEqual({ id: 12, createdAt: '2026-10-11T05:00:00' });
  });

  it('등록 mutation은 서버 오류를 자동 재전송하지 않는다', async () => {
    const requestCount = vi.fn<() => void>();
    server.use(
      http.post('*/users/me/cars', () => {
        requestCount();
        return HttpResponse.json(
          { message: '요청을 처리하지 못했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );

    const { result } = renderHook(() => useOwnedCarRegistrationMutation(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync(payload)).rejects.toMatchObject({ status: 500 });
    expect(requestCount).toHaveBeenCalledTimes(1);
  });
});
