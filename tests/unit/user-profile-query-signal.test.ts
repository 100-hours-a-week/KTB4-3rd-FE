import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { userProfileQueries } from '@/features/user-profile/api/user-profile.queries';
import { server } from '@/shared/api/mocks/server';

describe('userProfileQueries cancellation', () => {
  afterEach(() => {
    useAuthStore.getState().clearTokens();
    server.resetHandlers();
  });

  it('passes TanStack Query cancellation through the query factory to the API request', async () => {
    let requestSignal: AbortSignal | undefined;
    let markRequestStarted: () => void = () => undefined;
    const requestStarted = new Promise<void>((resolve) => {
      markRequestStarted = resolve;
    });

    server.use(
      http.get('*/users/me', async ({ request }) => {
        requestSignal = request.signal;
        markRequestStarted();
        await new Promise<void>((resolve) => {
          request.signal.addEventListener('abort', () => resolve(), { once: true });
        });

        return HttpResponse.json({ message: '사용자 정보 조회 성공', data: {} });
      }),
    );
    useAuthStore.getState().setAccessToken('test-access-token');

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const query = queryClient.fetchQuery(userProfileQueries.current()).catch(() => undefined);

    await requestStarted;
    await queryClient.cancelQueries({ queryKey: userProfileQueries.all() });
    await query;

    expect(requestSignal?.aborted).toBe(true);
    queryClient.clear();
  });
});
