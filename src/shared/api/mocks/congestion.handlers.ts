import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

type MockCongestionStatus = 'SMOOTH' | 'CONGESTED' | 'CROWDED' | 'DELAYED' | 'ACCIDENT';
type ViewportField = 'sw_lat' | 'sw_lng' | 'ne_lat' | 'ne_lng';
type Viewport = Record<ViewportField, number>;

const VIEWPORT_FIELDS: ViewportField[] = ['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng'];

const congestionSpots = [
  {
    id: 5,
    name: '판교역',
    lat: 37.3947,
    lng: 127.1112,
    status: 'CROWDED' as const,
    window_end: '2026-10-27T08:10:00',
  },
  {
    id: 12,
    name: '정자역',
    lat: 37.3667,
    lng: 127.108,
    status: 'CONGESTED' as const,
    window_end: '2026-10-27T08:10:00',
  },
  {
    id: 18,
    name: '강남역',
    lat: 37.4979,
    lng: 127.0276,
    status: 'SMOOTH' as const,
    window_end: '2026-10-27T08:10:00',
  },
] satisfies readonly {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: MockCongestionStatus;
  window_end: string;
}[];

const congestionSpotDetails = new Map([
  [
    5,
    {
      name: '판교역',
      lat: 37.3947,
      lng: 127.1112,
      status: 'CROWDED' as const,
      reason: '퇴근 시간대 대기 인원 증가',
      window_end: '2026-10-27T18:10:00',
      analyzing: false,
    },
  ],
  [
    12,
    {
      name: '정자역',
      lat: 37.3667,
      lng: 127.108,
      status: 'CONGESTED' as const,
      reason: null,
      window_end: '2026-10-27T18:10:00',
      analyzing: false,
    },
  ],
  [
    13,
    {
      name: '판교역',
      lat: 37.3947,
      lng: 127.1112,
      status: 'CONGESTED' as const,
      reason: '퇴근 시간대 대기 인원 증가',
      window_end: '2026-10-27T18:10:00',
      analyzing: true,
    },
  ],
  [
    14,
    {
      name: '판교역',
      lat: 37.3947,
      lng: 127.1112,
      status: null,
      reason: null,
      window_end: null,
      analyzing: false,
    },
  ],
]);

function unauthorizedResponse() {
  return errorResponse('인증이 필요합니다', 'UNAUTHORIZED', null, 401);
}

function invalidViewportResponse(field: ViewportField | null) {
  return HttpResponse.json(
    {
      message: '지도 범위 값이 올바르지 않습니다',
      error: {
        code: 'VALIDATION_ERROR',
        field,
      },
    },
    { status: 400 },
  );
}

function parseViewport(request: Request): Viewport | Response {
  const params = new URL(request.url).searchParams;
  const values = new Map<ViewportField, number>();

  for (const field of VIEWPORT_FIELDS) {
    const rawValue = params.get(field);
    const value = rawValue === null || rawValue.trim() === '' ? NaN : Number(rawValue);
    const isLatitude = field.endsWith('lat');
    const max = isLatitude ? 90 : 180;

    if (!Number.isFinite(value) || Math.abs(value) > max) {
      return invalidViewportResponse(field);
    }

    values.set(field, value);
  }

  const viewport = Object.fromEntries(values) as Viewport;

  if (viewport.sw_lat >= viewport.ne_lat || viewport.sw_lng >= viewport.ne_lng) {
    return invalidViewportResponse('sw_lat');
  }

  return viewport;
}

function isInsideViewport(spot: { lat: number; lng: number }, viewport: Viewport) {
  return (
    spot.lat >= viewport.sw_lat &&
    spot.lat <= viewport.ne_lat &&
    spot.lng >= viewport.sw_lng &&
    spot.lng <= viewport.ne_lng
  );
}

function getDetailMessage(detail: { analyzing: boolean; reason: string | null }) {
  if (detail.analyzing) {
    return '혼잡 원인 분석 중';
  }

  if (detail.reason === null) {
    return '혼잡 원인 정보 없음';
  }

  return '조회에 성공했습니다';
}

export const congestionHandlers = [
  http.get('*/congestion/spots/:spotId', ({ params, request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const spotId = Number(params.spotId);

    if (spotId === 500) {
      return errorResponse('정보를 불러오지 못했어요', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    const detail = congestionSpotDetails.get(spotId);

    if (!Number.isSafeInteger(spotId) || spotId <= 0 || !detail) {
      return errorResponse('정보를 불러오지 못했어요', 'NOT_FOUND', null, 404);
    }

    return HttpResponse.json({
      message: getDetailMessage(detail),
      data: detail,
    });
  }),
  http.get('*/congestion/spots', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const viewport = parseViewport(request);

    if (viewport instanceof Response) {
      return viewport;
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: congestionSpots.filter((spot) => isInsideViewport(spot, viewport)),
        limit: 500,
        limit_exceeded: false,
      },
    });
  }),
];
