import { describe, expect, it } from 'vitest';

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

describe('MSW mock API', () => {
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
        Authorization: 'Bearer mock-signup-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nickname: '제리',
        bank_name: 'kb',
        account_no: '11012345678',
        terms_agreed: true,
      }),
    });
    const body = await readJson<MockApiResponse<{ access_token: string }>>(response);

    expect(response.status).toBe(201);
    expect(body.data.access_token).toBe('mock-access-token');
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
