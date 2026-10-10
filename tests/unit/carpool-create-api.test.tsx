import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';

import {
  createCarpool,
  useCarpoolCreateMutation,
  type CarpoolCreatePayload,
} from '@/features/carpool-create';
import { useAuthStore } from '@/entities/auth';
import { carpoolQueryKeys } from '@/shared/api/carpool/carpool-query-keys';
import { server } from '@/shared/api/mocks/server';

const payload: CarpoolCreatePayload = {
  origin_name: '판교역',
  origin_lat: 37.3945,
  origin_lng: 127.1112,
  dest_name: '강남역',
  dest_lat: 37.4979,
  dest_lng: 127.0276,
  departure_at: '2026-10-12T08:30:00.000Z',
  recruit_count: 3,
};

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
  useAuthStore.getState().clearTokens();
});

describe('카풀 등록 API', () => {
  it('payload snapshot을 인증 POST 요청으로 전달하고 생성 응답을 돌려준다', async () => {
    const received = vi.fn<(request: Request) => void>();
    server.use(
      http.post('*/carpools', async ({ request }) => {
        received(request.clone());
        return HttpResponse.json(
          {
            message: '카풀 등록을 성공했습니다',
            data: {
              id: 51,
              chat_room_id: 620,
              capacity: 4,
              current_count: 1,
              status: 'RECRUITING',
            },
          },
          { status: 201 },
        );
      }),
    );

    const response = await createCarpool('mock-access-token', payload);
    const request = received.mock.calls[0][0];

    expect(request.method).toBe('POST');
    expect(request.headers.get('authorization')).toBe('Bearer mock-access-token');
    expect(await request.json()).toEqual(payload);
    expect(response.data.id).toBe(51);
  });

  it('검증 오류의 status, code, field와 details를 보존한다', async () => {
    server.use(
      http.post('*/carpools', () =>
        HttpResponse.json(
          {
            message: '입력값을 확인해주세요',
            error: {
              code: 'VALIDATION_ERROR',
              field: 'dest_name',
              details: [
                { field: 'dest_name', reason: 'REQUIRED' },
                { field: 'recruit_count', reason: 'OUT_OF_RANGE' },
              ],
            },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(createCarpool('mock-access-token', payload)).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      field: 'dest_name',
      details: [
        { field: 'dest_name', reason: 'REQUIRED' },
        { field: 'recruit_count', reason: 'OUT_OF_RANGE' },
      ],
    });
  });

  it('차량 미등록 응답을 별도 오류 코드로 전달한다', async () => {
    server.use(
      http.post('*/carpools', () =>
        HttpResponse.json(
          {
            message: '차량 정보를 먼저 등록해주세요',
            error: { code: 'CAR_REGISTRATION_REQUIRED', field: null },
          },
          { status: 409 },
        ),
      ),
    );

    await expect(createCarpool('mock-access-token', payload)).rejects.toMatchObject({
      status: 409,
      code: 'CAR_REGISTRATION_REQUIRED',
      field: null,
    });
  });

  it('등록 mutation은 재전송하지 않고 성공 뒤 활성 핀·주변 목록 캐시를 무효화한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: true } },
    });
    const pinsKey = [...carpoolQueryKeys.pins(), { sw_lat: 37, sw_lng: 127 }];
    const nearbyKey = [...carpoolQueryKeys.nearby(), { sw_lat: 37, sw_lng: 127 }];
    queryClient.setQueryData(pinsKey, { items: [] });
    queryClient.setQueryData(nearbyKey, { pages: [] });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.post('*/carpools', () => {
        requestCount();
        return HttpResponse.json(
          {
            message: '카풀 등록을 성공했습니다',
            data: {
              id: 51,
              chat_room_id: 620,
              capacity: 4,
              current_count: 1,
              status: 'RECRUITING',
            },
          },
          { status: 201 },
        );
      }),
    );
    const { result } = renderHook(() => useCarpoolCreateMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.mutateAsync(payload);

    expect(requestCount).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryState(pinsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(nearbyKey)?.isInvalidated).toBe(true);
  });

  it('서버 오류에서 등록 요청을 자동 재전송하지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: true } },
    });
    const requestCount = vi.fn<() => void>();
    server.use(
      http.post('*/carpools', () => {
        requestCount();
        return HttpResponse.json(
          { message: '서버 오류가 발생했습니다', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );
    const { result } = renderHook(() => useCarpoolCreateMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.mutateAsync(payload)).rejects.toMatchObject({ status: 500 });

    expect(requestCount).toHaveBeenCalledTimes(1);
  });
});
