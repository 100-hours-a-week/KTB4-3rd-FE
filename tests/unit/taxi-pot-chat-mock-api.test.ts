import { describe, expect, it } from 'vitest';

import { MOCK_TAXI_POT_CHAT_SCENARIOS } from '@/shared/api/mocks/taxi-pots.handlers';

type MockApiResponse<T> = {
  data?: T;
  message: string;
  error?: {
    code: string;
    field: string | null;
    details?: { field: string; reason: string }[];
  };
};

type TaxiPotData = {
  id: number;
  chat_room_id: number;
  status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';
  origin_name: string;
  dest_name: string;
  departure_at: string;
  current_count: number;
  capacity: number;
  host_id: number;
};

const accessToken = 'mock-access-token';

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function getTaxiPot(companionId: number, token = accessToken) {
  return fetch(`http://localhost:8080/taxi-pots/${companionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function updateTaxiPotStatus(companionId: number, status: string, token = accessToken) {
  return fetch(`http://localhost:8080/taxi-pots/${companionId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
}

async function leaveTaxiPot(companionId: number, token = accessToken) {
  return fetch(`http://localhost:8080/taxi-pots/${companionId}/participants/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe('택시팟 채팅 흐름 mock API', () => {
  it('택시팟 상세 정보를 조회한다', async () => {
    const response = await getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);
    const body = await readJson<MockApiResponse<TaxiPotData>>(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: '조회에 성공했습니다',
      data: {
        id: 30,
        chat_room_id: 599,
        status: 'RECRUITING',
        origin_name: '판교역',
        dest_name: '강남역',
        departure_at: '2026-09-05T08:30:00.000Z',
        current_count: 2,
        capacity: 4,
        host_id: 7,
      },
    });
  });

  it('인증 토큰이 없거나 유효하지 않으면 각 API가 401을 반환한다', async () => {
    const responses = await Promise.all([
      getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID, 'invalid-token'),
      updateTaxiPotStatus(
        MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID,
        'IN_PROGRESS',
        'invalid-token',
      ),
      leaveTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID, 'invalid-token'),
    ]);

    for (const response of responses) {
      const body = await readJson<MockApiResponse<never>>(response);

      expect(response.status).toBe(401);
      expect(response.headers.get('www-authenticate')).toBe('Bearer');
      expect(body.error).toEqual({ code: 'UNAUTHORIZED', field: null });
    }
  });

  it.each([
    ['GET', () => getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.NOT_FOUND_COMPANION_ID)],
    [
      'PATCH',
      () => updateTaxiPotStatus(MOCK_TAXI_POT_CHAT_SCENARIOS.NOT_FOUND_COMPANION_ID, 'IN_PROGRESS'),
    ],
  ])('%s 존재하지 않는 택시팟이면 404를 반환한다', async (_method, request) => {
    const response = await request();
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(404);
    expect(body).toEqual({
      message: '존재하지 않는 매칭입니다',
      error: { code: 'TAXI_POT_NOT_FOUND', field: null },
    });
  });

  it('운행 상태를 순서에 맞게 변경하고 상세 조회에도 반영한다', async () => {
    const response = await updateTaxiPotStatus(
      MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID,
      'IN_PROGRESS',
    );
    const body = await readJson<MockApiResponse<TaxiPotData>>(response);

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({ status: 'IN_PROGRESS', current_count: 4 });

    const detailResponse = await getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);
    const detailBody = await readJson<MockApiResponse<TaxiPotData>>(detailResponse);

    expect(detailBody.data).toMatchObject({ status: 'IN_PROGRESS', current_count: 4 });
  });

  it('유효하지 않은 상태 값이면 validation error를 반환한다', async () => {
    const response = await updateTaxiPotStatus(
      MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID,
      'INVALID_STATUS',
    );
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      message: '유효하지 않은 상태 변경입니다',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'status',
        details: [{ field: 'status', reason: 'INVALID_ENUM' }],
      },
    });
  });

  it('허용되지 않은 상태 전이면 409를 반환한다', async () => {
    const response = await updateTaxiPotStatus(
      MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID,
      'COMPLETED',
    );
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(409);
    expect(body.error).toEqual({ code: 'INVALID_STATE_TRANSITION', field: null });
  });

  it('방장이 아닌 참여자가 운행 상태를 변경하면 403을 반환한다', async () => {
    const response = await updateTaxiPotStatus(
      MOCK_TAXI_POT_CHAT_SCENARIOS.MEMBER_COMPANION_ID,
      'IN_PROGRESS',
    );
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(403);
    expect(body).toEqual({
      message: '방장만 처리할 수 있어요',
      error: { code: 'HOST_ONLY', field: null },
    });
  });

  it('운행 전에는 택시팟에서 나가고 이후 조회가 404가 된다', async () => {
    const response = await leaveTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');

    const detailResponse = await getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);
    const detailBody = await readJson<MockApiResponse<never>>(detailResponse);

    expect(detailResponse.status).toBe(404);
    expect(detailBody).toEqual({
      message: '존재하지 않는 매칭입니다',
      error: { code: 'TAXI_POT_NOT_FOUND', field: null },
    });
  });

  it('운행 중에는 택시팟에서 나갈 수 없다', async () => {
    await updateTaxiPotStatus(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID, 'IN_PROGRESS');

    const response = await leaveTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({
      message: '운행 중에는 나갈 수 없습니다',
      error: { code: 'RIDE_IN_PROGRESS', field: null },
    });
  });

  it('운행 종료 후 정산 전에는 택시팟에서 나갈 수 없다', async () => {
    await updateTaxiPotStatus(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID, 'IN_PROGRESS');
    await updateTaxiPotStatus(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID, 'COMPLETED');

    const response = await leaveTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.DEFAULT_COMPANION_ID);
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(409);
    expect(body).toEqual({
      message: '정산 전에는 나갈 수 없습니다',
      error: { code: 'SETTLEMENT_IN_PROGRESS', field: null },
    });
  });

  it.each([
    ['GET', () => getTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID)],
    [
      'PATCH',
      () =>
        updateTaxiPotStatus(
          MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID,
          'IN_PROGRESS',
        ),
    ],
    ['DELETE', () => leaveTaxiPot(MOCK_TAXI_POT_CHAT_SCENARIOS.INTERNAL_SERVER_ERROR_COMPANION_ID)],
  ])('%s 서버 오류 시 500을 반환한다', async (_method, request) => {
    const response = await request();
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(500);
    expect(body.error).toEqual({ code: 'INTERNAL_SERVER_ERROR', field: null });
  });
});
