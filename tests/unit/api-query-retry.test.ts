import { describe, expect, it } from 'vitest';

import { ApiError } from '@/shared/api/client';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

describe('API query 재시도 정책', () => {
  it('5xx와 네트워크 오류만 한 번 재시도하고 1초 대기한다', () => {
    expect(shouldRetryApiQuery(0, new ApiError(500))).toBe(true);
    expect(shouldRetryApiQuery(0, new ApiError(599))).toBe(true);
    expect(shouldRetryApiQuery(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(API_QUERY_RETRY_DELAY).toBe(1_000);

    expect(shouldRetryApiQuery(1, new ApiError(500))).toBe(false);
    expect(shouldRetryApiQuery(1, new TypeError('Failed to fetch'))).toBe(false);
  });

  it('사용자 조치가 필요한 응답과 요청 취소는 재시도하지 않는다', () => {
    expect(
      [400, 401, 403, 404, 409, 422, 600].some((status) =>
        shouldRetryApiQuery(0, new ApiError(status)),
      ),
    ).toBe(false);
    expect(shouldRetryApiQuery(0, new DOMException('요청 취소', 'AbortError'))).toBe(false);
    expect(shouldRetryApiQuery(0, new Error('Unknown error'))).toBe(false);
  });
});
