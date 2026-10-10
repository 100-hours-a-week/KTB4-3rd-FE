import { http, HttpResponse } from 'msw';

import type { CarpoolSummary, CarpoolViewport } from '@/shared/api/carpool';

import { errorResponse } from './mock-utils';

const pins = [
  { id: 51, lat: 37.5547, lng: 126.9707 },
  { id: 77, lat: 37.556, lng: 126.973 },
];
const items: CarpoolSummary[] = [
  {
    id: 51,
    host: { name: '김우림', profile_image_url: null },
    origin_name: '서울역',
    dest_name: '판교역',
    departure_at: '2026-10-10T09:40:00.000Z',
    distance_m: 320,
    current_count: 2,
    capacity: 4,
    is_full: false,
    is_expired: false,
  },
  {
    id: 77,
    host: { name: '홍길동', profile_image_url: null },
    origin_name: '서울역 1번 출구',
    dest_name: '강남역',
    departure_at: '2026-10-10T10:00:00.000Z',
    distance_m: 540,
    current_count: 4,
    capacity: 4,
    is_full: true,
    is_expired: false,
  },
  {
    id: 88,
    host: { name: '김민수', profile_image_url: null },
    origin_name: '서울역 2번 출구',
    dest_name: '유스페이스1',
    departure_at: '2026-10-09T09:40:00.000Z',
    distance_m: 700,
    current_count: 1,
    capacity: 3,
    is_full: false,
    is_expired: true,
  },
];

const origins = [...pins, { id: 88, lat: 37.559, lng: 126.979 }];
const createdAt: Record<number, number> = { 51: 1, 77: 2, 88: 3 };

function insideViewport(point: { lat: number; lng: number }, viewport: CarpoolViewport) {
  return (
    point.lat >= viewport.sw_lat &&
    point.lat <= viewport.ne_lat &&
    point.lng >= viewport.sw_lng &&
    point.lng <= viewport.ne_lng
  );
}
function distanceMeters(lat: number, lng: number, origin: { lat: number; lng: number }) {
  const radians = Math.PI / 180;
  const a =
    Math.sin(((origin.lat - lat) * radians) / 2) ** 2 +
    Math.cos(lat * radians) *
      Math.cos(origin.lat * radians) *
      Math.sin(((origin.lng - lng) * radians) / 2) ** 2;
  return Math.round(
    6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(1 - Math.min(1, a))),
  );
}

function readCoordinates(params: URLSearchParams, fields: string[]) {
  for (const field of fields) {
    const raw = params.get(field);
    const value = raw === null || raw.trim() === '' ? NaN : Number(raw);
    const bound = field.endsWith('lat') ? 90 : 180;
    if (!Number.isFinite(value) || Math.abs(value) > bound) {
      return HttpResponse.json(
        {
          message: '요청 값 검증에 실패했습니다.',
          error: {
            code: 'VALIDATION_ERROR',
            field,
            details: [{ field, reason: raw === null || raw === '' ? 'REQUIRED' : 'OUT_OF_RANGE' }],
          },
        },
        { status: 422 },
      );
    }
  }
}
function readViewport(params: URLSearchParams) {
  const response = readCoordinates(params, ['sw_lat', 'sw_lng', 'ne_lat', 'ne_lng']);
  if (response) {
    return response;
  }
  const viewport: CarpoolViewport = {
    sw_lat: Number(params.get('sw_lat')),
    sw_lng: Number(params.get('sw_lng')),
    ne_lat: Number(params.get('ne_lat')),
    ne_lng: Number(params.get('ne_lng')),
  };
  if (viewport.sw_lat >= viewport.ne_lat || viewport.sw_lng >= viewport.ne_lng) {
    return errorResponse('지도 영역이 올바르지 않습니다', 'VIEWPORT_OUT_OF_RANGE', null, 400);
  }
  if (viewport.ne_lat - viewport.sw_lat > 1 || viewport.ne_lng - viewport.sw_lng > 1) {
    return errorResponse('조회 범위가 너무 넓습니다', 'VIEWPORT_TOO_LARGE', null, 400);
  }
  return viewport;
}
export const carpoolReadHandlers = [
  http.get('*/carpool-pins', ({ request }) => {
    const viewport = readViewport(new URL(request.url).searchParams);
    if (viewport instanceof Response) {
      return viewport;
    }
    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: pins.filter((pin) => insideViewport(pin, viewport)),
        limit: 500,
        limit_exceeded: false,
      },
    });
  }),
  http.get('*/carpools', ({ request }) => {
    const params = new URL(request.url).searchParams;
    const viewport = readViewport(params);
    if (viewport instanceof Response) {
      return viewport;
    }
    const invalidLocation = readCoordinates(params, ['lat', 'lng']);
    if (invalidLocation) {
      return invalidLocation;
    }
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    const nextCursor = `mock-carpool-page-2:${[lat, lng, viewport.sw_lat, viewport.sw_lng, viewport.ne_lat, viewport.ne_lng].join(':')}`;
    const cursor = params.get('cursor');
    if (cursor !== null && cursor !== nextCursor) {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }
    const nearby = items
      .flatMap((item) => {
        const origin = origins.find((point) => point.id === item.id);
        return origin && insideViewport(origin, viewport)
          ? [{ ...item, distance_m: distanceMeters(lat, lng, origin) }]
          : [];
      })
      .sort((a, b) => a.distance_m - b.distance_m || createdAt[b.id] - createdAt[a.id]);
    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: {
        items: cursor === nextCursor ? nearby.slice(2) : nearby.slice(0, 2),
        next_cursor: cursor === nextCursor || nearby.length <= 2 ? null : nextCursor,
      },
    });
  }),
];
