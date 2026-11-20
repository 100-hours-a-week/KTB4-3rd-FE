import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { PushTokenRegistrationSync } from '@/features/push-token';
import { getFcmRegistrationToken } from '@/features/push-token/model/get-fcm-registration-token';
import { server } from '@/shared/api/mocks/server';

vi.mock('@/features/push-token/model/get-fcm-registration-token', () => ({
  getFcmRegistrationToken: vi.fn<() => Promise<string | null>>(),
}));

const originalNotification = window.Notification;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function setNotificationPermission(permission: NotificationPermission) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission },
  });
}

beforeEach(() => {
  setNotificationPermission('granted');
  vi.mocked(getFcmRegistrationToken).mockResolvedValue('mock-fcm-registration-token');
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.getState().clearTokens();
  vi.clearAllMocks();

  if (originalNotification) {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: originalNotification,
    });
  } else {
    Reflect.deleteProperty(window, 'Notification');
  }
});

describe('PushTokenRegistrationSync', () => {
  it('로그인 상태에서 알림 권한이 허용되면 FCM 토큰을 서버에 등록한다', async () => {
    const requests: { authorization: string | null; payload: unknown }[] = [];
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.put('*/push-tokens', async ({ request }) => {
        requests.push({
          authorization: request.headers.get('Authorization'),
          payload: await request.json(),
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(<PushTokenRegistrationSync />, { wrapper: createWrapper() });

    await waitFor(() => expect(requests).toHaveLength(1));
    expect(getFcmRegistrationToken).toHaveBeenCalledOnce();
    expect(requests[0]).toEqual({
      authorization: 'Bearer mock-access-token',
      payload: { token: 'mock-fcm-registration-token' },
    });
  });

  it('로그인되어 있어도 알림 권한이 허용되지 않았으면 토큰을 가져오지 않는다', async () => {
    setNotificationPermission('default');
    useAuthStore.getState().setAccessToken('mock-access-token');

    render(<PushTokenRegistrationSync />, { wrapper: createWrapper() });
    await act(async () => Promise.resolve());

    expect(getFcmRegistrationToken).not.toHaveBeenCalled();
  });

  it('비로그인 상태에서는 토큰을 가져오거나 서버에 등록하지 않는다', async () => {
    const requests: Request[] = [];
    server.use(
      http.put('*/push-tokens', ({ request }) => {
        requests.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(<PushTokenRegistrationSync />, { wrapper: createWrapper() });
    await act(async () => Promise.resolve());

    expect(getFcmRegistrationToken).not.toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });
});
