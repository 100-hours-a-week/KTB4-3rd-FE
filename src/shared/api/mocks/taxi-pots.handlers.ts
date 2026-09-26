import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const MAX_LOCATION_NAME_LENGTH = 100;
const MAX_DEPARTURE_HOURS = 3;
const COORDINATE_PRECISION = 6;

export const MOCK_TAXI_POT_CHAT_SCENARIOS = {
  DEFAULT_COMPANION_ID: 30,
  MEMBER_COMPANION_ID: 31,
  NOT_FOUND_COMPANION_ID: 404,
  INTERNAL_SERVER_ERROR_COMPANION_ID: 999,
} as const;

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

type TaxiPotStatus = 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';

type MockTaxiPot = {
  id: number;
  chat_room_id: number;
  status: TaxiPotStatus;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  current_count: number;
  capacity: number;
  host_id: number;
  is_participating: boolean;
  is_host: boolean;
};

function createMockTaxiPots() {
  return new Map<number, MockTaxiPot>([
    [
      MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID,
      {
        id: 30,
        chat_room_id: 599,
        status: 'RECRUITING',
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: 2,
        capacity: 4,
        host_id: 7,
        is_participating: true,
        is_host: true,
      },
    ],
    [
      MOCK_TAXI_POT_CHAT_SCENARIOS.MEMBER_COMPANION_ID,
      {
        id: 31,
        chat_room_id: 600,
        status: 'RECRUITING',
        origin_name: '서울역',
        dest_name: '강남역',
        departure_at: '2026-09-05T09:00:00.000Z',
        current_count: 3,
        capacity: 4,
        host_id: 8,
        is_participating: true,
        is_host: false,
      },
    ],
  ]);
}

let mockTaxiPots = createMockTaxiPots();

export function resetTaxiPotMockState() {
  mockTaxiPots = createMockTaxiPots();
}

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

function unauthorizedResponse() {
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

function taxiPotNotFoundResponse() {
  return errorResponse('존재하지 않는 매칭입니다', 'TAXI_POT_NOT_FOUND', null, 404);
}

function internalServerErrorResponse() {
  return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
}

function getTaxiPot(companionId: string) {
  return mockTaxiPots.get(Number(companionId));
}

function toTaxiPotResponse(taxiPot: MockTaxiPot) {
  return {
    id: taxiPot.id,
    chat_room_id: taxiPot.chat_room_id,
    status: taxiPot.status,
    origin_name: taxiPot.origin_name,
    dest_name: taxiPot.dest_name,
    departure_at: taxiPot.departure_at,
    current_count: taxiPot.current_count,
    capacity: taxiPot.capacity,
    host_id: taxiPot.host_id,
  };
}

function invalidStatusResponse() {
  return HttpResponse.json(
    {
      message: '유효하지 않은 상태 변경입니다',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'status',
        details: [{ field: 'status', reason: 'INVALID_ENUM' }],
      },
    },
    { status: 400 },
  );
}

function invalidStateTransitionResponse() {
  return errorResponse('유효하지 않은 상태 변경입니다', 'INVALID_STATE_TRANSITION', null, 409);
}

export const taxiPotsHandlers = [
  http.post('*/taxi-pots', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
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
  http.get('*/taxi-pots/:companionId', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const companionId = String(params.companionId);

    if (Number(companionId) === MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID) {
      return internalServerErrorResponse();
    }

    const taxiPot = getTaxiPot(companionId);

    if (!taxiPot || !taxiPot.is_participating) {
      return taxiPotNotFoundResponse();
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: toTaxiPotResponse(taxiPot),
    });
  }),
  http.patch('*/taxi-pots/:companionId', async ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const companionId = String(params.companionId);

    if (Number(companionId) === MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID) {
      return internalServerErrorResponse();
    }

    const taxiPot = getTaxiPot(companionId);

    if (!taxiPot || !taxiPot.is_participating) {
      return taxiPotNotFoundResponse();
    }

    if (!taxiPot.is_host) {
      return errorResponse('방장만 처리할 수 있어요', 'HOST_ONLY', null, 403);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return invalidStatusResponse();
    }

    if (!isObject(body) || !['IN_PROGRESS', 'COMPLETED'].includes(body.status as string)) {
      return invalidStatusResponse();
    }

    const nextStatus = body.status as Exclude<TaxiPotStatus, 'RECRUITING'>;
    const isValidTransition =
      (taxiPot.status === 'RECRUITING' && nextStatus === 'IN_PROGRESS') ||
      (taxiPot.status === 'IN_PROGRESS' && nextStatus === 'COMPLETED');

    if (!isValidTransition) {
      return invalidStateTransitionResponse();
    }

    taxiPot.status = nextStatus;
    taxiPot.current_count = taxiPot.capacity;

    return HttpResponse.json({
      message: '운행 상태가 변경됐어요',
      data: toTaxiPotResponse(taxiPot),
    });
  }),
  http.delete('*/taxi-pots/:companionId/participants/me', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const companionId = String(params.companionId);

    if (Number(companionId) === MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID) {
      return internalServerErrorResponse();
    }

    const taxiPot = getTaxiPot(companionId);

    if (!taxiPot || !taxiPot.is_participating) {
      return errorResponse('참여 중인 택시팟이 아닙니다', 'TAXI_POT_NOT_FOUND', null, 404);
    }

    if (taxiPot.status === 'IN_PROGRESS') {
      return errorResponse('운행 중에는 나갈 수 없습니다', 'RIDE_IN_PROGRESS', null, 409);
    }

    if (taxiPot.status === 'COMPLETED') {
      return errorResponse('정산 전에는 나갈 수 없습니다', 'SETTLEMENT_IN_PROGRESS', null, 409);
    }

    taxiPot.is_participating = false;

    return new HttpResponse(null, { status: 204 });
  }),
];
