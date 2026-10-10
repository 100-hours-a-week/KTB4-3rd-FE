import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  carpoolRequestListQueries,
  getCarpoolRequestList,
} from '@/_pages/chat-list/api/carpool-requests';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('carpool request list API', () => {
  it('direction을 보내고 첫 페이지 요청에서 cursor를 생략한다', async () => {
    const requestedQuery =
      vi.fn<(query: { direction: string | null; cursor: string | null }) => void>();

    server.use(
      http.get('*/users/me/carpool-requests', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedQuery({
          direction: searchParams.get('direction'),
          cursor: searchParams.get('cursor'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'SENT', items: [], next_cursor: null },
        });
      }),
    );

    await getCarpoolRequestList({ direction: 'SENT' });

    expect(requestedQuery).toHaveBeenCalledWith({ direction: 'SENT', cursor: null });
  });

  it('후속 페이지의 cursor를 전달한다', async () => {
    const requestedQuery =
      vi.fn<(query: { direction: string | null; cursor: string | null }) => void>();

    server.use(
      http.get('*/users/me/carpool-requests', ({ request }) => {
        const searchParams = new URL(request.url).searchParams;
        requestedQuery({
          direction: searchParams.get('direction'),
          cursor: searchParams.get('cursor'),
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'RECEIVED', items: [], next_cursor: null },
        });
      }),
    );

    await getCarpoolRequestList({ direction: 'RECEIVED', cursor: 'next-page' });

    expect(requestedQuery).toHaveBeenCalledWith({ direction: 'RECEIVED', cursor: 'next-page' });
  });

  it('요청 방향이 다른 응답은 사용하지 않는다', async () => {
    server.use(
      http.get('*/users/me/carpool-requests', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { direction: 'RECEIVED', items: [], next_cursor: null },
        }),
      ),
    );

    await expect(getCarpoolRequestList({ direction: 'SENT' })).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_RESPONSE_DIRECTION',
    });
  });

  it('viewerId와 방향에 따라 목록 캐시 key를 분리한다', () => {
    expect(carpoolRequestListQueries.list(7, 'SENT').queryKey).not.toEqual(
      carpoolRequestListQueries.list(8, 'SENT').queryKey,
    );
    expect(carpoolRequestListQueries.list(7, 'SENT').queryKey).not.toEqual(
      carpoolRequestListQueries.list(7, 'RECEIVED').queryKey,
    );
  });
});
