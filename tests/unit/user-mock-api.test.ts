import { beforeEach, describe, expect, it } from 'vitest';

import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { resetUserMockState } from '@/shared/api/mocks/user.handlers';

type MockApiResponse<T> = {
  data: T;
  message: string;
  error?: {
    code: string;
    field: string | null;
  };
};

const API_URL = 'http://localhost:8080';
const authorization = { Authorization: `Bearer ${MOCK_ACCESS_TOKEN}` };

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

describe('사용자 정보 및 정산 계좌 mock API', () => {
  beforeEach(() => {
    resetUserMockState();
  });

  it('인증된 사용자의 정보를 조회하고 계좌 미등록 상태를 반환한다', async () => {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: authorization,
    });
    const body = await readJson<
      MockApiResponse<{
        id: number;
        nickname: string;
        profile_image_url: string | null;
        has_bank_account: boolean;
      }>
    >(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: '내 정보 조회에 성공했습니다',
      data: {
        id: 7,
        nickname: '제리',
        profile_image_url: 'https://cdn.moyeota.app/profile/15.jpg',
        has_bank_account: false,
      },
    });
  });

  it('인증되지 않은 사용자 요청을 거부한다', async () => {
    const meResponse = await fetch(`${API_URL}/users/me`);
    const meBody = await readJson<MockApiResponse<never>>(meResponse);

    expect(meResponse.status).toBe(401);
    expect(meResponse.headers.get('WWW-Authenticate')).toBe('Bearer');
    expect(meBody.error).toEqual({ code: 'UNAUTHORIZED', field: null });

    const bankAccountResponse = await fetch(`${API_URL}/users/me/bank-account`, {
      method: 'PUT',
      body: JSON.stringify({ bank_name: 'KB국민은행', account_no: '11012345678' }),
    });

    expect(bankAccountResponse.status).toBe(401);
    expect(bankAccountResponse.headers.get('WWW-Authenticate')).toBe('Bearer');
  });

  it('정산 계좌를 저장하고 이후 내 정보 조회에 등록 상태를 반영한다', async () => {
    const payload = { bank_name: 'KB국민은행', account_no: '11012345678' };
    const response = await fetch(`${API_URL}/users/me/bank-account`, {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body =
      await readJson<MockApiResponse<{ bank_name: string; account_no_masked: string }>>(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: '정산 계좌가 저장되었습니다',
      data: { bank_name: 'KB국민은행', account_no_masked: '******5678' },
    });

    const meResponse = await fetch(`${API_URL}/users/me`, {
      headers: authorization,
    });
    const meBody = await readJson<MockApiResponse<{ has_bank_account: boolean }>>(meResponse);

    expect(meBody.data.has_bank_account).toBe(true);
  });

  it('필수값, 은행명, 계좌번호 검증 오류를 반환한다', async () => {
    const cases = [
      {
        payload: { bank_name: 'KB국민은행' },
        message: '은행명과 계좌번호를 모두 입력해주세요',
        field: 'bank_name',
      },
      {
        payload: { bank_name: '없는은행', account_no: '11012345678' },
        message: '지원하지 않는 은행입니다',
        field: 'bank_name',
      },
      {
        payload: { bank_name: 'KB국민은행', account_no: '1234' },
        message: '계좌번호는 숫자 10~14자리로 입력해주세요',
        field: 'account_no',
      },
    ];

    for (const testCase of cases) {
      const response = await fetch(`${API_URL}/users/me/bank-account`, {
        method: 'PUT',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload),
      });
      const body = await readJson<MockApiResponse<never>>(response);

      expect(response.status).toBe(422);
      expect(body).toMatchObject({
        message: testCase.message,
        error: { code: 'VALIDATION_ERROR', field: testCase.field },
      });
    }
  });

  it('같은 정산 계좌를 다시 저장해도 같은 응답을 반환한다', async () => {
    const request = {
      method: 'PUT',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_name: '토스뱅크', account_no: '1234567890' }),
    };

    const firstResponse = await fetch(`${API_URL}/users/me/bank-account`, request);
    const firstBody = await readJson<MockApiResponse<unknown>>(firstResponse);
    const secondResponse = await fetch(`${API_URL}/users/me/bank-account`, request);
    const secondBody = await readJson<MockApiResponse<unknown>>(secondResponse);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(secondBody).toEqual(firstBody);
  });
});
