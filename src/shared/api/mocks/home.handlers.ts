import { http, HttpResponse } from 'msw';

import { errorResponse } from './mock-utils';

const MOCK_NEXT_CURSOR = 'v1.eyJsYXN0X2Rpc3RhbmNlX20iOjU0MH0';
const MAX_VIEWPORT_SPAN = 20;

const MOCK_MAP_PINS = [
  { type: 'COMPANION', id: 10, lat: 37.3945, lng: 127.1112 },
  { type: 'COMMUNITY', id: 88, lat: 37.5123, lng: 127.041 },
] as const;

const MOCK_NEARBY_POSTS = [
  {
    type: 'COMPANION',
    id: 10,
    title: '판교역 → 강남역',
    author: { nickname: '우림', profile_image_url: null },
    distance_m: 320,
    current_count: 2,
    capacity: 4,
    departure_at: '2026-09-05T08:30:00.000Z',
    is_expired: false,
    transport_type: 'TAXI',
  },
  {
    type: 'COMMUNITY',
    id: 88,
    title: '판교역 근처 카페 추천',
    author: { nickname: '루디', profile_image_url: null },
    distance_m: 540,
    comment_count: 3,
    created_at: '2026-09-03T10:00:00.000Z',
  },
] as const;

const MOCK_COMPANION_POST = {
  id: 10,
  title: '판교역 → 강남역',
  content: '택시 같이 타실 분 구해요',
  transport_type: 'TAXI',
  origin_name: '판교역',
  dest_name: '강남역',
  departure_at: '2026-09-05T08:30:00.000Z',
  is_expired: false,
  current_count: 2,
  capacity: 4,
  is_full: false,
  author: { nickname: '우림' },
  participants: [
    { nickname: '우림', profile_image_url: null },
    { nickname: '루디', profile_image_url: 'https://example.com/profile/rudy.png' },
  ],
  chat_room_id: 501,
  joined: true,
} as const;

const MOCK_COMMUNITY_POST = {
  id: 88,
  title: '판교역 근처 카페 추천',
  content: '조용히 작업하기 좋은 카페가 있을까요?',
  author: { nickname: '루디' },
  comment_count: 3,
  created_at: '2026-09-03T10:00:00.000Z',
} as const;

type ViewportField = 'sw_lat' | 'sw_lng' | 'ne_lat' | 'ne_lng';
type CoordinateField = ViewportField | 'lat' | 'lng';
type Viewport = Record<ViewportField, number>;

const VIEWPORT_FIELDS: ViewportField[] = ['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng'];

function parseNumber(searchParams: URLSearchParams, field: CoordinateField) {
  const rawValue = searchParams.get(field);

  if (rawValue === null || rawValue.trim() === '') {
    return null;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : null;
}

function isLatitude(value: number) {
  return value >= -90 && value <= 90;
}

function isLongitude(value: number) {
  return value >= -180 && value <= 180;
}

function invalidViewportResponse(field: ViewportField | null, reason?: string) {
  return HttpResponse.json(
    {
      message: '지도 범위 값이 올바르지 않습니다',
      error: {
        code: 'VALIDATION_ERROR',
        field,
        ...(field && reason ? { details: [{ field, reason }] } : {}),
      },
    },
    { status: 400 },
  );
}

function parseViewport(request: Request): { viewport: Viewport } | { response: Response } {
  const searchParams = new URL(request.url).searchParams;
  const values = Object.fromEntries(
    VIEWPORT_FIELDS.map((field) => [field, parseNumber(searchParams, field)]),
  ) as Record<ViewportField, number | null>;

  for (const field of VIEWPORT_FIELDS) {
    const value = values[field];
    const isLatitudeField = field.endsWith('lat');

    if (value === null || (isLatitudeField ? !isLatitude(value) : !isLongitude(value))) {
      return { response: invalidViewportResponse(field, 'OUT_OF_RANGE') };
    }
  }

  const viewport = values as Viewport;

  if (viewport.sw_lat >= viewport.ne_lat || viewport.sw_lng >= viewport.ne_lng) {
    return { response: invalidViewportResponse(null) };
  }

  if (
    viewport.ne_lat - viewport.sw_lat > MAX_VIEWPORT_SPAN ||
    viewport.ne_lng - viewport.sw_lng > MAX_VIEWPORT_SPAN
  ) {
    return {
      response: HttpResponse.json(
        {
          message: '조회 범위가 너무 넓습니다. 지도를 확대해주세요',
          error: { code: 'VIEWPORT_TOO_LARGE', field: null },
        },
        { status: 400 },
      ),
    };
  }

  return { viewport };
}

function parseNearbyLocation(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const lat = parseNumber(searchParams, 'lat');
  const lng = parseNumber(searchParams, 'lng');

  if (lat === null || !isLatitude(lat)) {
    return {
      response: errorResponse('좌표 값이 올바르지 않습니다', 'VALIDATION_ERROR', 'lat', 400),
    };
  }

  if (lng === null || !isLongitude(lng)) {
    return {
      response: errorResponse('좌표 값이 올바르지 않습니다', 'VALIDATION_ERROR', 'lng', 400),
    };
  }

  return { location: { lat, lng } };
}

function isInsideViewport(pin: (typeof MOCK_MAP_PINS)[number], viewport: Viewport) {
  return (
    pin.lat >= viewport.sw_lat &&
    pin.lat <= viewport.ne_lat &&
    pin.lng >= viewport.sw_lng &&
    pin.lng <= viewport.ne_lng
  );
}

export const homeHandlers = [
  http.get('*/map-pins', ({ request }) => {
    const result = parseViewport(request);

    if ('response' in result) {
      return result.response;
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: MOCK_MAP_PINS.filter((pin) => isInsideViewport(pin, result.viewport)),
        limit: 500,
        limit_exceeded: false,
      },
    });
  }),
  http.get('*/nearby-posts', ({ request }) => {
    const viewportResult = parseViewport(request);

    if ('response' in viewportResult) {
      return viewportResult.response;
    }

    const locationResult = parseNearbyLocation(request);

    if ('response' in locationResult) {
      return locationResult.response;
    }

    const cursor = new URL(request.url).searchParams.get('cursor');

    if (cursor !== null && cursor !== MOCK_NEXT_CURSOR) {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: cursor === MOCK_NEXT_CURSOR ? [] : MOCK_NEARBY_POSTS,
        next_cursor: cursor === MOCK_NEXT_CURSOR ? null : MOCK_NEXT_CURSOR,
      },
    });
  }),
  http.get('*/companion-posts/:companionId', ({ params }) => {
    const companionId = Number(params.companionId);

    if (companionId === 11) {
      return errorResponse('취소된 동행모집입니다', 'COMPANION_POST_CLOSED', null, 410);
    }

    if (companionId === 999) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (companionId !== MOCK_COMPANION_POST.id) {
      return errorResponse('존재하지 않는 게시글입니다', 'POST_NOT_FOUND', null, 404);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: MOCK_COMPANION_POST,
    });
  }),
  http.get('*/community-posts/:postId', ({ params }) => {
    const postId = Number(params.postId);

    if (postId === 89) {
      return errorResponse('삭제된 게시글입니다', 'GONE', null, 410);
    }

    if (postId === 999) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (postId !== MOCK_COMMUNITY_POST.id) {
      return errorResponse('존재하지 않는 게시글입니다', 'POST_NOT_FOUND', null, 404);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: MOCK_COMMUNITY_POST,
    });
  }),
];
