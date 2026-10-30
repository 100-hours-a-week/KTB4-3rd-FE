import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import {
  getCongestionSpotDetail,
  getCongestionSpots,
  type CongestionViewport,
} from '@/entities/congestion';
import { ApiError } from '@/shared/api/client';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { server } from '@/shared/api/mocks/server';

const viewport: CongestionViewport = {
  sw_lat: 37.3,
  sw_lng: 127,
  ne_lat: 37.6,
  ne_lng: 127.2,
};

describe('혼잡도 조회 API', () => {
  it('혼잡도 핀 목록에 지도 범위와 bearer token을 전달한다', async () => {
    let received: Request | undefined;
    server.use(
      http.get('*/congestion/spots', ({ request }) => {
        received = request;
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], limit: 500, limit_exceeded: false },
        });
      }),
    );

    await getCongestionSpots(viewport, MOCK_ACCESS_TOKEN);

    if (!received) {
      throw new Error('요청이 없습니다.');
    }

    expect(Object.fromEntries(new URL(received.url).searchParams)).toEqual(
      Object.fromEntries(Object.entries(viewport).map(([key, value]) => [key, String(value)])),
    );
    expect(received.headers.get('authorization')).toBe(`Bearer ${MOCK_ACCESS_TOKEN}`);
  });

  it('혼잡도 핀 목록 응답의 상태와 갱신 구간을 그대로 반환한다', async () => {
    const response = await getCongestionSpots(viewport, MOCK_ACCESS_TOKEN);

    expect(response).toEqual({
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
          {
            id: 12,
            name: '정자역',
            lat: 37.3667,
            lng: 127.108,
            status: 'CONGESTED',
            window_end: '2026-10-27T08:10:00',
          },
          {
            id: 18,
            name: '강남역',
            lat: 37.4979,
            lng: 127.0276,
            status: 'SMOOTH',
            window_end: '2026-10-27T08:10:00',
          },
        ],
        limit: 500,
        limit_exceeded: false,
      },
    });
  });

  it('인증 토큰이 없으면 혼잡도 핀 목록 조회를 거부한다', async () => {
    await expect(getCongestionSpots(viewport, '')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
    });
  });

  it('지도 범위 값이 올바르지 않으면 400 검증 오류를 전달한다', async () => {
    await expect(
      getCongestionSpots({ ...viewport, sw_lat: Number.NaN }, MOCK_ACCESS_TOKEN),
    ).rejects.toMatchObject({
      name: 'ApiError',
      message: '지도 범위 값이 올바르지 않습니다',
      status: 400,
      code: 'VALIDATION_ERROR',
      field: 'sw_lat',
    });
  });

  it('혼잡도 핀 목록의 500 오류를 ApiError로 전달한다', async () => {
    server.use(
      http.get('*/congestion/spots', () =>
        HttpResponse.json(
          {
            message: '혼잡도를 불러오지 못했어요',
            error: { code: 'INTERNAL_SERVER_ERROR', field: null },
          },
          { status: 500 },
        ),
      ),
    );

    await expect(getCongestionSpots(viewport, MOCK_ACCESS_TOKEN)).rejects.toMatchObject({
      name: 'ApiError',
      message: '혼잡도를 불러오지 못했어요',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      field: null,
    });
  });

  it('혼잡도 핀 상세에서 원인과 위치 정보를 반환한다', async () => {
    const response = await getCongestionSpotDetail(5, MOCK_ACCESS_TOKEN);

    expect(response).toEqual({
      message: '조회에 성공했습니다',
      data: {
        name: '판교역',
        lat: 37.3947,
        lng: 127.1112,
        status: 'CROWDED',
        reason: '퇴근 시간대 대기 인원 증가',
        window_end: '2026-10-27T18:10:00',
        analyzing: false,
      },
    });
  });

  it('혼잡 원인 없음·분석 중·표시 기한 만료 응답을 구분한다', async () => {
    const withoutReason = await getCongestionSpotDetail(12, MOCK_ACCESS_TOKEN);
    const analyzing = await getCongestionSpotDetail(13, MOCK_ACCESS_TOKEN);
    const expired = await getCongestionSpotDetail(14, MOCK_ACCESS_TOKEN);

    expect(withoutReason).toMatchObject({
      message: '혼잡 원인 정보 없음',
      data: { status: 'CONGESTED', reason: null, analyzing: false },
    });
    expect(analyzing).toMatchObject({
      message: '혼잡 원인 분석 중',
      data: { status: 'CONGESTED', reason: '퇴근 시간대 대기 인원 증가', analyzing: true },
    });
    expect(expired).toMatchObject({
      message: '혼잡 원인 정보 없음',
      data: { status: null, reason: null, window_end: null, analyzing: false },
    });
  });

  it('존재하지 않는 혼잡도 핀 상세의 404를 전달한다', async () => {
    await expect(getCongestionSpotDetail(999, MOCK_ACCESS_TOKEN)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
      field: null,
    });
  });

  it('혼잡도 핀 상세의 500 오류를 전달한다', async () => {
    await expect(getCongestionSpotDetail(500, MOCK_ACCESS_TOKEN)).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      field: null,
    });
  });

  it('혼잡도 핀 상세 요청에도 bearer token과 spot id를 전달한다', async () => {
    let received: Request | undefined;
    server.use(
      http.get('*/congestion/spots/:spotId', ({ request }) => {
        received = request;
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            name: '판교역',
            lat: 37.3947,
            lng: 127.1112,
            status: 'CROWDED',
            reason: null,
            window_end: null,
            analyzing: false,
          },
        });
      }),
    );

    await getCongestionSpotDetail(5, MOCK_ACCESS_TOKEN);

    expect(received?.url).toMatch(/\/congestion\/spots\/5$/);
    expect(received?.headers.get('authorization')).toBe(`Bearer ${MOCK_ACCESS_TOKEN}`);
  });

  it('취소된 요청에 AbortSignal을 전달한다', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      getCongestionSpots(viewport, MOCK_ACCESS_TOKEN, controller.signal),
    ).rejects.toThrow('aborted');
  });

  it('ApiError는 명세에 없는 응답도 안전하게 처리한다', () => {
    expect(new ApiError(500).details).toBeUndefined();
  });
});
