import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { congestionQueries } from '@/features/congestion';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { server } from '@/shared/api/mocks/server';

const viewport = { sw_lat: 37.3, sw_lng: 127, ne_lat: 37.6, ne_lng: 127.2 };

const clients: QueryClient[] = [];

function createQueryClient() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(queryClient);
  return queryClient;
}

afterEach(() => {
  clients.forEach((queryClient) => queryClient.clear());
  clients.length = 0;
  useAuthStore.getState().clearTokens();
  server.resetHandlers();
});

describe('혼잡도 query factory', () => {
  it('지도 범위와 핀 id가 query key에 포함된다', () => {
    expect(congestionQueries.spots(viewport).queryKey).toEqual(['congestion', 'spots', viewport]);
    expect(congestionQueries.detail(5).queryKey).toEqual(['congestion', 'detail', 5]);
  });

  it('조회 조건이 없거나 비활성화되면 요청 옵션을 비활성화한다', () => {
    expect(congestionQueries.spots(null).enabled).toBe(false);
    expect(congestionQueries.spots(viewport, false).enabled).toBe(false);
    expect(congestionQueries.detail(null).enabled).toBe(false);
  });

  it('인증 토큰을 사용해 혼잡도 핀 목록을 조회한다', async () => {
    let authorization: string | null = null;
    server.use(
      http.get('*/congestion/spots', ({ request }) => {
        authorization = request.headers.get('authorization');
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: 5,
                name: '판교역',
                lat: 37.3947,
                lng: 127.1112,
                status: 'CROWDED',
                window_end: '2026-10-27T08:10:00',
              },
            ],
            limit: 500,
            limit_exceeded: false,
          },
        });
      }),
    );
    useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);

    const response = await createQueryClient().fetchQuery(congestionQueries.spots(viewport));

    expect(authorization).toBe(`Bearer ${MOCK_ACCESS_TOKEN}`);
    expect(response.data.items[0]?.id).toBe(5);
  });

  it('인증 토큰을 사용해 혼잡도 핀 상세를 조회한다', async () => {
    useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);

    const response = await createQueryClient().fetchQuery(congestionQueries.detail(5));

    expect(response.data).toMatchObject({
      name: '판교역',
      status: 'CROWDED',
      analyzing: false,
    });
  });
});
