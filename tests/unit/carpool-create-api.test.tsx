import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

import {
  createCarpool,
  useCarpoolCreateMutation,
  type CarpoolCreatePayload,
} from '@/features/carpool-create';
import { useAuthStore } from '@/entities/auth';
import { carpoolQueries } from '@/shared/api/carpool';
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}

const viewport = {
  sw_lat: 37.3,
  sw_lng: 127,
  ne_lat: 37.6,
  ne_lng: 127.2,
};
const nearbyConditions = {
  ...viewport,
  lat: 37.3945,
  lng: 127.1112,
};

const pinsResponse = {
  message: '조회에 성공했습니다',
  data: { items: [], limit: 500, limit_exceeded: false },
};
const nearbyResponse = {
  message: '조회에 성공했습니다',
  data: { items: [], next_cursor: null },
};

function renderActiveCarpoolQueries(queryClient: QueryClient) {
  return renderHook(
    () => ({
      pins: useQuery(carpoolQueries.pins(viewport)),
      nearby: useInfiniteQuery(carpoolQueries.nearby(nearbyConditions)),
      mutation: useCarpoolCreateMutation(),
    }),
    { wrapper: createWrapper(queryClient) },
  );
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

  it('검증 오류의 status, code, field를 보존한다', async () => {
    server.use(
      http.post('*/carpools', () =>
        HttpResponse.json(
          {
            message: '입력값을 확인해주세요',
            error: {
              code: 'VALIDATION_ERROR',
              field: 'dest_name',
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

  it('등록 mutation은 재전송하지 않고 카풀 핀·주변 카풀 캐시를 무효화한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: true } },
    });
    const pinsKey = carpoolQueries.pins(viewport).queryKey;
    const nearbyKey = carpoolQueries.nearby(nearbyConditions).queryKey;
    queryClient.setQueryData(pinsKey, {
      message: '조회 성공',
      data: { items: [], limit: 500, limit_exceeded: false },
    });
    queryClient.setQueryData(nearbyKey, {
      pages: [nearbyResponse],
      pageParams: [undefined],
    });
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

  it('카풀 재조회가 끝나기 전에 POST 성공을 확정하고 재조회 오류를 등록 실패로 바꾸지 않는다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: true } },
    });
    server.use(
      http.get('*/carpool-pins', () => HttpResponse.json(pinsResponse)),
      http.get('*/carpools', () => HttpResponse.json(nearbyResponse)),
    );

    const { result } = renderActiveCarpoolQueries(queryClient);
    await waitFor(() => {
      expect(result.current.pins.isSuccess).toBe(true);
      expect(result.current.nearby.isSuccess).toBe(true);
    });

    const refetchGate = deferred<void>();
    const refetchStarted = deferred<void>();
    let refetchCount = 0;
    const failAfterGate = async () => {
      refetchCount += 1;
      if (refetchCount === 2) {
        refetchStarted.resolve();
      }
      await refetchGate.promise;
      return HttpResponse.json(
        { message: '요청 값을 확인해주세요', error: { code: 'VALIDATION_ERROR' } },
        { status: 422 },
      );
    };
    server.use(
      http.get('*/carpool-pins', failAfterGate),
      http.get('*/carpools', failAfterGate),
      http.post('*/carpools', () =>
        HttpResponse.json(
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
        ),
      ),
    );

    const mutationPromise = result.current.mutation.mutateAsync(payload);
    await refetchStarted.promise;

    let mutationFinished = false;
    void mutationPromise.finally(() => {
      mutationFinished = true;
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const completedBeforeGet = mutationFinished;

    refetchGate.resolve();
    const mutationResponse = await mutationPromise;
    await waitFor(() => {
      expect(result.current.pins.isError).toBe(true);
      expect(result.current.nearby.isError).toBe(true);
    });

    expect(completedBeforeGet).toBe(true);
    expect(mutationResponse.data.id).toBe(51);
    expect(queryClient.getMutationCache().getAll()[0]?.state.status).toBe('success');
    queryClient.clear();
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
