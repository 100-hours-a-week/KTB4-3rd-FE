import { describe, expect, it } from 'vitest';

import {
  kakaoLoginRedirectHandler,
  MOCK_FRONTEND_URL,
} from '@/shared/api/mocks/kakao-login.handlers';
import { server } from '@/shared/api/mocks/server';

type MockApiResponse<T> = {
  data: T;
  message?: string;
  error?: {
    code: string;
    field: string | null;
  };
};

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

const validSignupPayload = {
  nickname: '제리',
  gender: 'MALE',
  bank_name: 'KB국민은행',
  account_no: '11012345678',
  agreements: {
    service: true,
    location: true,
    gender: true,
    account_third_party: true,
    marketing: false,
  },
};

describe('MSW mock API', () => {
  it('기존 회원이면 로그인 완료 콜백으로 리다이렉트한다', async () => {
    server.use(kakaoLoginRedirectHandler('existing-user'));

    const response = await fetch('http://localhost:8080/auth/kakao/login', {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(`${MOCK_FRONTEND_URL}/auth/callback?status=ok`);
    expect(response.headers.get('set-cookie')).toContain('refresh_token=mock-access-token');
  });

  it('신규 회원이면 회원가입 필요 콜백으로 리다이렉트한다', async () => {
    server.use(kakaoLoginRedirectHandler('new-user'));

    const response = await fetch('http://localhost:8080/auth/kakao/login', {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${MOCK_FRONTEND_URL}/auth/callback?status=signup_required`,
    );
    expect(response.headers.get('set-cookie')).toContain('signup_token=mock-signup-token');
  });

  it('로그인 실패면 오류 콜백으로 리다이렉트한다', async () => {
    server.use(kakaoLoginRedirectHandler('failure'));

    const response = await fetch('http://localhost:8080/auth/kakao/login', {
      redirect: 'manual',
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe(
      `${MOCK_FRONTEND_URL}/auth/callback?error=access_denied&error_description=%EC%82%AC%EC%9A%A9%EC%9E%90%EA%B0%80+%EB%A1%9C%EA%B7%B8%EC%9D%B8%EC%9D%84+%EC%B7%A8%EC%86%8C%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4`,
    );
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('카카오 신규 로그인 응답을 반환한다', async () => {
    const response = await fetch('http://localhost:8080/auth/kakao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'mock-code' }),
    });
    const body =
      await readJson<
        MockApiResponse<{ signup_token: string; is_new_user: boolean; user_id: number }>
      >(response);

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      signup_token: 'mock-signup-token',
      is_new_user: true,
      user_id: 15,
    });
  });

  it('토큰 재발급 응답과 refresh token 쿠키를 반환한다', async () => {
    const response = await fetch('http://localhost:8080/auth/tokens', { method: 'POST' });
    const body = await readJson<MockApiResponse<{ access_token: string }>>(response);

    expect(response.status).toBe(200);
    expect(body.data.access_token).toBe('mock-access-token');
    expect(response.headers.get('set-cookie')).toContain('refresh_token=mock-refresh-token');
  });

  it('닉네임 중복확인 응답을 반환한다', async () => {
    const response = await fetch(
      'http://localhost:8080/users/nickname-availability?nickname=%EC%A0%9C%EB%A6%AC',
    );
    const body = await readJson<MockApiResponse<{ available: boolean }>>(response);

    expect(response.status).toBe(200);
    expect(body.data.available).toBe(true);
  });

  it('회원가입 성공 응답을 반환한다', async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: {
        Cookie: 'signup_token=mock-signup-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validSignupPayload),
    });
    const body = await readJson<MockApiResponse<{ access_token: string }>>(response);

    expect(response.status).toBe(201);
    expect(body.data.access_token).toBe('mock-access-token');

    const reusedResponse = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Cookie: 'signup_token=mock-signup-token' },
      body: JSON.stringify(validSignupPayload),
    });
    const reusedBody = await readJson<MockApiResponse<never>>(reusedResponse);

    expect(reusedResponse.status).toBe(401);
    expect(reusedBody.error).toEqual({ code: 'UNAUTHORIZED', field: null });
  });

  it('필수 약관에 동의하지 않으면 agreements 필드를 반환한다', async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-signup-token' },
      body: JSON.stringify({
        ...validSignupPayload,
        agreements: { ...validSignupPayload.agreements, location: false },
      }),
    });
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(400);
    expect(body.error).toEqual({ code: 'VALIDATION_ERROR', field: 'agreements.location' });
  });

  it('중복 닉네임을 거부한다', async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-signup-token' },
      body: JSON.stringify({ ...validSignupPayload, nickname: '중복닉네임' }),
    });
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(409);
    expect(body.error).toEqual({ code: 'NICKNAME_DUPLICATE', field: 'nickname' });
  });

  it('명세에 맞지 않는 닉네임을 거부한다', async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-signup-token' },
      body: JSON.stringify({ ...validSignupPayload, nickname: '제리!' }),
    });
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(422);
    expect(body.error).toEqual({ code: 'VALIDATION_ERROR', field: 'nickname' });
  });

  it('지원하지 않는 은행과 잘못된 계좌번호를 거부한다', async () => {
    const bankResponse = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-signup-token' },
      body: JSON.stringify({ ...validSignupPayload, bank_name: '없는은행' }),
    });
    const bankBody = await readJson<MockApiResponse<never>>(bankResponse);

    expect(bankResponse.status).toBe(422);
    expect(bankBody.error).toEqual({ code: 'VALIDATION_ERROR', field: 'bank_name' });

    const accountResponse = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: { Authorization: 'Bearer mock-signup-token' },
      body: JSON.stringify({ ...validSignupPayload, account_no: '1234' }),
    });
    const accountBody = await readJson<MockApiResponse<never>>(accountResponse);

    expect(accountResponse.status).toBe(422);
    expect(accountBody.error).toEqual({ code: 'VALIDATION_ERROR', field: 'account_no' });
  });

  it('잘못된 회원가입 토큰을 거부한다', async () => {
    const response = await fetch('http://localhost:8080/users', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ terms_agreed: true }),
    });
    const body = await readJson<MockApiResponse<never>>(response);

    expect(response.status).toBe(401);
    expect(body.error).toEqual({ code: 'UNAUTHORIZED', field: null });
  });
});
