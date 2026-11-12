import { http, HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export const MOCK_PUSH_TOKEN_SCENARIOS = {
  SECONDARY_USER_ACCESS_TOKEN: 'mock-access-token-secondary-user',
  INTERNAL_SERVER_ERROR_TOKEN: '__mock_internal_server_error__',
} as const;

type MockPushToken = {
  userId: number;
  updatedAt: string;
};

const mockPushTokens = new Map<string, MockPushToken>();

function getMockUserId(accessToken: string | null) {
  if (accessToken === MOCK_ACCESS_TOKEN) {
    return 7;
  }

  if (accessToken === MOCK_PUSH_TOKEN_SCENARIOS.SECONDARY_USER_ACCESS_TOKEN) {
    return 8;
  }

  return null;
}

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
  );
}

function validationError(reason: 'REQUIRED' | 'MAX_LENGTH') {
  return HttpResponse.json(
    {
      message: '입력값을 확인해주세요',
      error: {
        code: 'VALIDATION_ERROR',
        field: 'token',
        details: [{ field: 'token', reason }],
      },
    },
    { status: 400 },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function currentTimestamp() {
  return new Date().toISOString();
}

export const pushTokenHandlers = [
  http.put('*/push-tokens', async ({ request }) => {
    const userId = getMockUserId(getBearerToken(request));

    if (userId === null) {
      return unauthorizedResponse();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return validationError('REQUIRED');
    }

    const token = isObject(body) ? body.token : undefined;

    if (typeof token !== 'string' || token.trim() === '') {
      return validationError('REQUIRED');
    }

    if (token.length > 255) {
      return validationError('MAX_LENGTH');
    }

    if (token === MOCK_PUSH_TOKEN_SCENARIOS.INTERNAL_SERVER_ERROR_TOKEN) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    mockPushTokens.set(token, { userId, updatedAt: currentTimestamp() });

    return new HttpResponse(null, { status: 204 });
  }),
  http.delete('*/push-tokens', async ({ request }) => {
    const userId = getMockUserId(getBearerToken(request));

    if (userId === null) {
      return unauthorizedResponse();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return validationError('REQUIRED');
    }

    const token = isObject(body) ? body.token : undefined;

    if (typeof token !== 'string' || token.trim() === '') {
      return validationError('REQUIRED');
    }

    if (token === MOCK_PUSH_TOKEN_SCENARIOS.INTERNAL_SERVER_ERROR_TOKEN) {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    if (mockPushTokens.get(token)?.userId === userId) {
      mockPushTokens.delete(token);
    }

    return new HttpResponse(null, { status: 204 });
  }),
];

export function resetPushTokenMockState() {
  mockPushTokens.clear();
}
