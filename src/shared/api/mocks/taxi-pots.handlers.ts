import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const MAX_LOCATION_NAME_LENGTH = 100;
const MAX_DEPARTURE_HOURS = 3;
const COORDINATE_PRECISION = 6;

export const MOCK_TAXI_POT_SCENARIOS = {
  BANK_ACCOUNT_REQUIRED: '__mock_bank_account_required__',
  MATCH_ALREADY_IN_PROGRESS: '__mock_match_already_in_progress__',
  MATCH_BUSY: '__mock_match_busy__',
  INTERNAL_SERVER_ERROR: '__mock_internal_server_error__',
} as const;

type ValidationDetail = {
  field: string;
  reason: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validationErrorResponse(details: readonly ValidationDetail[]) {
  return HttpResponse.json(
    {
      message: '매칭 시작에 실패했습니다. 다시 시도해주세요',
      error: {
        code: 'VALIDATION_ERROR',
        field: details[0]?.field ?? null,
        details,
      },
    },
    { status: 400 },
  );
}

function validateLocationName(body: Record<string, unknown>, field: 'origin_name' | 'dest_name') {
  const value = body[field];

  if (typeof value !== 'string' || value.trim() === '') {
    return { field, reason: 'REQUIRED' };
  }

  if (value.length > MAX_LOCATION_NAME_LENGTH) {
    return { field, reason: 'MAX_LENGTH' };
  }

  return null;
}

function validateCoordinate(
  body: Record<string, unknown>,
  field: 'origin_lat' | 'origin_lng' | 'dest_lat' | 'dest_lng',
  min: number,
  max: number,
) {
  const value = body[field];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { field, reason: value === undefined || value === null ? 'REQUIRED' : 'INVALID_TYPE' };
  }

  if (value < min || value > max) {
    return { field, reason: 'OUT_OF_RANGE' };
  }

  if (Number(value.toFixed(COORDINATE_PRECISION)) !== value) {
    return { field, reason: 'INVALID_PRECISION' };
  }

  return null;
}

function validateDepartureAt(body: Record<string, unknown>) {
  const value = body.departure_at;

  if (typeof value !== 'string' || value.trim() === '') {
    return { field: 'departure_at', reason: 'REQUIRED' };
  }

  const departureAt = new Date(value);

  if (Number.isNaN(departureAt.getTime())) {
    return { field: 'departure_at', reason: 'INVALID_FORMAT' };
  }

  return null;
}

function validateRequest(body: Record<string, unknown>) {
  const details = [
    validateLocationName(body, 'origin_name'),
    validateLocationName(body, 'dest_name'),
    validateCoordinate(body, 'origin_lat', -90, 90),
    validateCoordinate(body, 'origin_lng', -180, 180),
    validateCoordinate(body, 'dest_lat', -90, 90),
    validateCoordinate(body, 'dest_lng', -180, 180),
    validateDepartureAt(body),
  ].filter((detail): detail is ValidationDetail => detail !== null);

  return details;
}

function departureTimeErrorResponse(
  message: string,
  code: 'DEPARTURE_TIME_PASSED' | 'DEPARTURE_TIME_TOO_FAR',
) {
  return errorResponse(message, code, 'departure_at', 422);
}

export const taxiPotsHandlers = [
  http.post('*/taxi-pots', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return HttpResponse.json(
        {
          message: '로그인이 필요합니다',
          error: { code: 'UNAUTHORIZED', field: null },
        },
        {
          status: 401,
          headers: { 'WWW-Authenticate': 'Bearer' },
        },
      );
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return validationErrorResponse([{ field: 'body', reason: 'INVALID_FORMAT' }]);
    }

    if (!isObject(rawBody)) {
      return validationErrorResponse([{ field: 'body', reason: 'INVALID_FORMAT' }]);
    }

    const validationDetails = validateRequest(rawBody);

    if (validationDetails.length > 0) {
      return validationErrorResponse(validationDetails);
    }

    const originName = rawBody.origin_name as string;
    const destinationName = rawBody.dest_name as string;
    const originLat = rawBody.origin_lat as number;
    const originLng = rawBody.origin_lng as number;
    const destinationLat = rawBody.dest_lat as number;
    const destinationLng = rawBody.dest_lng as number;
    const departureAt = new Date(rawBody.departure_at as string);
    const now = Date.now();

    if (departureAt.getTime() <= now) {
      return departureTimeErrorResponse('현재 시각 이후로 선택해주세요', 'DEPARTURE_TIME_PASSED');
    }

    if (departureAt.getTime() > now + MAX_DEPARTURE_HOURS * 60 * 60 * 1000) {
      return departureTimeErrorResponse('3시간 이내로 선택해주세요', 'DEPARTURE_TIME_TOO_FAR');
    }

    if (
      originName === destinationName &&
      originLat === destinationLat &&
      originLng === destinationLng
    ) {
      return errorResponse(
        '출발지와 도착지는 다르게 설정해주세요',
        'SAME_ORIGIN_DEST',
        'dest_name',
        422,
      );
    }

    if (originName === MOCK_TAXI_POT_SCENARIOS.BANK_ACCOUNT_REQUIRED) {
      return errorResponse('정산 계좌를 먼저 등록해주세요', 'BANK_ACCOUNT_REQUIRED', null, 409);
    }

    if (originName === MOCK_TAXI_POT_SCENARIOS.MATCH_ALREADY_IN_PROGRESS) {
      return errorResponse('이미 진행 중인 매칭이 있어요', 'MATCH_ALREADY_IN_PROGRESS', null, 409);
    }

    if (originName === MOCK_TAXI_POT_SCENARIOS.MATCH_BUSY) {
      return errorResponse(
        '요청이 몰려 매칭하지 못했어요. 잠시 후 다시 시도해주세요',
        'MATCH_BUSY',
        null,
        409,
      );
    }

    if (originName === MOCK_TAXI_POT_SCENARIOS.INTERNAL_SERVER_ERROR) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    return HttpResponse.json(
      {
        message: '매칭을 시작했습니다',
        data: {
          id: 30,
          chat_room_id: 599,
          status: 'RECRUITING',
          current_count: 2,
          capacity: 4,
        },
      },
      {
        status: 201,
        headers: { Location: '/taxi-pots/30' },
      },
    );
  }),
];
