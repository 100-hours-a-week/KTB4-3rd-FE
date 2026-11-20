import { ApiError } from './client';

export const API_QUERY_RETRY_DELAY = 1_000;

export function shouldRetryApiQuery(failureCount: number, error: unknown) {
  if (failureCount >= 1) {
    return false;
  }

  if (error instanceof ApiError) {
    return error.status >= 500 && error.status < 600;
  }

  return error instanceof TypeError;
}
