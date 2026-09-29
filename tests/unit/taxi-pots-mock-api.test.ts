import { describe, expect, it } from 'vitest';

import { MOCK_TAXI_POT_SCENARIOS } from '@/shared/api/mocks/taxi-pots.handlers';

type TaxiPotPayload = {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
};

type MockApiResponse<T> = {
  data?: T;
  message: string;
  error?: {
    code: string;
    field: string | null;
    details?: { field: string; reason: string }[];
  };
};

function createValidPayload(overrides: Partial<TaxiPotPayload> = {}): TaxiPotPayload {
  return {
    origin_name: '판교역',
    origin_lat: 37.3945,
    origin_lng: 127.1112,
    dest_name: '강남역',
    dest_lat: 37.4979,
    dest_lng: 127.0276,
    departure_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

async function postTaxiPot(
  payload: Partial<TaxiPotPayload> = createValidPayload(),
  token = 'mock-access-token',
) {
  return fetch('http://localhost:8080/taxi-pots', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe('택시팟 매칭 시작 mock API', () => {
  it('유효한 요청이면 매칭 정보와 Location을 반환한다', async () => {
    const response = await postTaxiPot();
    const body = await readJson<
      MockApiResponse<{
        id: number;
        chat_room_id: number;
        status: string;
        current_count: number;
        capacity: number;
      }>
    >(response);

    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe('/taxi-pots/30');
    expect(body).toEqual({
      message: '매칭을 시작했습니다',
      data: {
        id: 30,
        chat_room_id: 599,
        status: 'RECRUITING',
        current_count: 2,
        capacity: 4,
      },
    });
  });

  it('access token이 없거나 유효하지 않으면 WWW-Authenticate와 함께 401을 반환한다', async () => {
    const response = await postTaxiPot(createValidPayload(), 'invalid-token');
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
    expect(body).toMatchObject({
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    });
  });

  it('필수 필드가 없으면 validation details를 반환한다', async () => {
    const response = await postTaxiPot({ ...createValidPayload(), origin_name: undefined });
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: '매칭 시작에 실패했습니다. 다시 시도해주세요',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'origin_name',
        details: [{ field: 'origin_name', reason: 'REQUIRED' }],
      },
    });
  });

  it('좌표가 6자리 정밀도를 넘으면 validation error를 반환한다', async () => {
    const response = await postTaxiPot(createValidPayload({ origin_lat: 37.3945678 }));
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(400);
    expect(body.error).toEqual({
      code: 'VALIDATION_ERROR',
      field: 'origin_lat',
      details: [{ field: 'origin_lat', reason: 'INVALID_PRECISION' }],
    });
  });

  it.each([
    ['과거 시각', new Date(Date.now() - 60 * 1000).toISOString(), 'DEPARTURE_TIME_PASSED'],
    [
      '3시간을 초과한 시각',
      new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      'DEPARTURE_TIME_TOO_FAR',
    ],
  ])('%s이면 422를 반환한다', async (_label, departureAt, code) => {
    const response = await postTaxiPot(createValidPayload({ departure_at: departureAt }));
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(422);
    expect(body.error).toMatchObject({ code, field: 'departure_at' });
  });

  it('출발지와 도착지가 같으면 422를 반환한다', async () => {
    const response = await postTaxiPot(
      createValidPayload({
        dest_name: '판교역',
        dest_lat: 37.3945,
        dest_lng: 127.1112,
      }),
    );
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(422);
    expect(body.error).toEqual({ code: 'SAME_ORIGIN_DEST', field: 'dest_name' });
  });

  it.each([
    [MOCK_TAXI_POT_SCENARIOS.BANK_ACCOUNT_REQUIRED, 409, 'BANK_ACCOUNT_REQUIRED'],
    [MOCK_TAXI_POT_SCENARIOS.MATCH_ALREADY_IN_PROGRESS, 409, 'MATCH_ALREADY_IN_PROGRESS'],
    [MOCK_TAXI_POT_SCENARIOS.MATCH_BUSY, 409, 'MATCH_BUSY'],
    [MOCK_TAXI_POT_SCENARIOS.INTERNAL_SERVER_ERROR, 500, 'INTERNAL_SERVER_ERROR'],
  ])('mock 시나리오 %s에 맞는 오류 응답을 반환한다', async (originName, status, code) => {
    const response = await postTaxiPot(createValidPayload({ origin_name: originName }));
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(status);
    expect(body.error).toMatchObject({ code });
  });
});
