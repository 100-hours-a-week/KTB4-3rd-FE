import { describe, expect, it } from 'vitest';

import { MOCK_LOGOUT_SCENARIOS } from '@/shared/api/mocks/auth.handlers';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { MOCK_WITHDRAWAL_SCENARIOS } from '@/shared/api/mocks/user.handlers';

const API_URL = 'http://localhost:8080';

type ErrorBody = {
  message: string;
  error: { code: string; field: null };
};

function refreshSession(refreshToken: string) {
  return fetch(`${API_URL}/auth/tokens`, {
    method: 'POST',
    headers: { Cookie: `refresh_token=${refreshToken}` },
  });
}

function deleteSession(refreshToken?: string) {
  return fetch(`${API_URL}/auth/sessions`, {
    method: 'DELETE',
    headers: refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : undefined,
  });
}

function withdraw(accessToken?: string) {
  return fetch(`${API_URL}/users/me`, {
    method: 'DELETE',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

function expectExpiredRefreshCookie(response: Response) {
  expect(response.headers.get('set-cookie')).toContain('refresh_token=; Max-Age=0; Path=/api/auth');
}

describe('로그아웃 mock API', () => {
  it('refresh token 쿠키나 access token 없이도 빈 204와 쿠키 만료 헤더를 반환한다', async () => {
    const response = await deleteSession();

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expectExpiredRefreshCookie(response);
  });

  it('현재 기기 세션만 폐기하고 재요청에도 204를 반환한다', async () => {
    const first = await deleteSession('mock-refresh-token');
    const second = await deleteSession('mock-refresh-token');

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect(await refreshSession('mock-refresh-token')).toHaveProperty('status', 401);
    expect(await refreshSession(MOCK_LOGOUT_SCENARIOS.OTHER_DEVICE_REFRESH_TOKEN)).toHaveProperty(
      'status',
      200,
    );
  });

  it('회전 전 refresh token으로 로그아웃해도 같은 세션을 폐기한다', async () => {
    const response = await deleteSession(MOCK_LOGOUT_SCENARIOS.ROTATED_REFRESH_TOKEN);

    expect(response.status).toBe(204);
    expect(await refreshSession('mock-refresh-token')).toHaveProperty('status', 401);
  });

  it('서버 오류 응답을 반환한다', async () => {
    const response = await deleteSession(MOCK_LOGOUT_SCENARIOS.INTERNAL_SERVER_ERROR);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: '서버 오류가 발생했습니다',
      error: { code: 'INTERNAL_SERVER_ERROR', field: null },
    });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('회원 탈퇴 mock API', () => {
  it('Bearer 토큰이 없거나 유효하지 않으면 WWW-Authenticate와 401을 반환한다', async () => {
    for (const token of [undefined, 'invalid-token']) {
      const response = await withdraw(token);

      expect(response.status).toBe(401);
      expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
      expect((await response.json()) as ErrorBody).toEqual({
        message: '로그인이 필요합니다',
        error: { code: 'UNAUTHORIZED', field: null },
      });
    }
  });

  it('Bearer 토큰만으로 탈퇴하고 모든 세션을 폐기하며 재요청에도 빈 204를 반환한다', async () => {
    const first = await withdraw(MOCK_ACCESS_TOKEN);
    const second = await withdraw(MOCK_ACCESS_TOKEN);

    expect(first.status).toBe(204);
    expect(await first.text()).toBe('');
    expectExpiredRefreshCookie(first);
    expect(second.status).toBe(204);
    expect(await refreshSession('mock-refresh-token')).toHaveProperty('status', 401);
    expect(await refreshSession(MOCK_LOGOUT_SCENARIOS.OTHER_DEVICE_REFRESH_TOKEN)).toHaveProperty(
      'status',
      401,
    );
  });

  it('탈퇴한 사용자의 프로필과 정산 계좌를 익명 상태로 반영한다', async () => {
    await fetch(`${API_URL}/users/me/bank-account`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
      body: JSON.stringify({ bank_name: 'kb', account_no: '11012345678' }),
    });

    await withdraw(MOCK_ACCESS_TOKEN);

    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` },
    });
    const body = (await response.json()) as {
      data: { nickname: string; profile_image_url: string | null; has_bank_account: boolean };
    };

    expect(body.data).toMatchObject({
      nickname: '탈퇴한사용자_7',
      profile_image_url: null,
      has_bank_account: false,
    });
  });

  it.each([
    {
      token: MOCK_WITHDRAWAL_SCENARIOS.ACTIVE_HOST_EXISTS,
      message: '방장으로 진행 중인 동행이 있어 탈퇴할 수 없습니다',
      code: 'ACTIVE_HOST_EXISTS',
    },
    {
      token: MOCK_WITHDRAWAL_SCENARIOS.ACTIVE_TAXI_POT_EXISTS,
      message: '참여 중인 택시팟이 있어 탈퇴할 수 없습니다',
      code: 'ACTIVE_TAXI_POT_EXISTS',
    },
  ])('$code 충돌이면 409를 반환하고 쿠키를 만료시키지 않는다', async ({ token, message, code }) => {
    const response = await withdraw(token);

    expect(response.status).toBe(409);
    expect((await response.json()) as ErrorBody).toEqual({
      message,
      error: { code, field: null },
    });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await refreshSession('mock-refresh-token')).toHaveProperty('status', 200);
  });

  it('서버 오류 응답을 반환한다', async () => {
    const response = await withdraw(MOCK_WITHDRAWAL_SCENARIOS.INTERNAL_SERVER_ERROR);

    expect(response.status).toBe(500);
    expect((await response.json()) as ErrorBody).toEqual({
      message: '서버 오류가 발생했습니다',
      error: { code: 'INTERNAL_SERVER_ERROR', field: null },
    });
  });
});
