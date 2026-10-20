import { http, HttpResponse } from 'msw';

import { revokeAllMockSessions } from './auth.handlers';
import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const MOCK_WITHDRAWAL_SCENARIOS = {
  ACTIVE_HOST_EXISTS: '__mock_active_host_exists__',
  ACTIVE_TAXI_POT_EXISTS: '__mock_active_taxi_pot_exists__',
  INTERNAL_SERVER_ERROR: '__mock_internal_server_error__',
} as const;

const REFRESH_TOKEN_COOKIE_CLEAR = 'refresh_token=; Max-Age=0; Path=/api/auth; HttpOnly';

const MOCK_BANK_CODES = new Set(['kb', 'shinhan', 'woori', 'hana', 'nh', 'ibk', 'kakao', 'toss']);

const MOCK_USER = {
  id: 7,
  nickname: '제리',
  profile_image_url: 'https://cdn.moyeota.app/profile/15.jpg',
} as const;

type MockBankAccount = {
  bank_name: string;
  account_no: string;
};

let mockBankAccount: MockBankAccount | null = null;
let withdrawnAt: string | null = null;

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

function validationErrorResponse(message: string, field: string) {
  return HttpResponse.json(
    {
      message,
      error: { code: 'VALIDATION_ERROR', field },
    },
    { status: 422 },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getMockUser() {
  return {
    ...MOCK_USER,
    nickname: withdrawnAt ? `탈퇴한사용자_${MOCK_USER.id}` : MOCK_USER.nickname,
    profile_image_url: withdrawnAt ? null : MOCK_USER.profile_image_url,
    has_bank_account: mockBankAccount !== null,
  };
}

function maskAccountNumber(accountNo: string) {
  return `******${accountNo.slice(-4)}`;
}

export const userHandlers = [
  http.delete('*/users/me', ({ request }) => {
    const token = getBearerToken(request);

    if (token === MOCK_WITHDRAWAL_SCENARIOS.ACTIVE_HOST_EXISTS) {
      return errorResponse(
        '방장으로 진행 중인 동행이 있어 탈퇴할 수 없습니다',
        'ACTIVE_HOST_EXISTS',
        null,
        409,
      );
    }

    if (token === MOCK_WITHDRAWAL_SCENARIOS.ACTIVE_TAXI_POT_EXISTS) {
      return errorResponse(
        '참여 중인 택시팟이 있어 탈퇴할 수 없습니다',
        'ACTIVE_TAXI_POT_EXISTS',
        null,
        409,
      );
    }

    if (token === MOCK_WITHDRAWAL_SCENARIOS.INTERNAL_SERVER_ERROR) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (token !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    withdrawnAt ??= new Date().toISOString();
    mockBankAccount = null;
    revokeAllMockSessions();

    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': REFRESH_TOKEN_COOKIE_CLEAR },
    });
  }),
  http.get('*/users/me', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    return HttpResponse.json({
      message: '내 정보 조회에 성공했습니다',
      data: getMockUser(),
    });
  }),
  http.put('*/users/me/bank-account', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    const bankName = isObject(body) ? body.bank_name : undefined;
    const accountNo = isObject(body) ? body.account_no : undefined;

    if (
      typeof bankName !== 'string' ||
      bankName.trim() === '' ||
      typeof accountNo !== 'string' ||
      accountNo.trim() === ''
    ) {
      return validationErrorResponse('은행명과 계좌번호를 모두 입력해주세요', 'bank_name');
    }

    if (!MOCK_BANK_CODES.has(bankName)) {
      return validationErrorResponse('지원하지 않는 은행입니다', 'bank_name');
    }

    if (!/^\d{10,14}$/.test(accountNo)) {
      return validationErrorResponse('계좌번호는 숫자 10~14자리로 입력해주세요', 'account_no');
    }

    mockBankAccount = { bank_name: bankName, account_no: accountNo };

    return HttpResponse.json({
      message: '정산 계좌가 저장되었습니다',
      data: {
        bank_name: bankName,
        account_no_masked: maskAccountNumber(accountNo),
      },
    });
  }),
];

export function resetUserMockState() {
  mockBankAccount = null;
  withdrawnAt = null;
}
