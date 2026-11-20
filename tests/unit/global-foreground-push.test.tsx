import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The root layout is a Next.js entrypoint outside the src alias.
// eslint-disable-next-line import/no-relative-parent-imports
import RootLayout from '../../app/layout';
import { useAuthStore } from '@/entities/auth';

type PushPayload = {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
};

const mocks = vi.hoisted(() => ({
  receiveMessage: null as ((payload: PushPayload) => void) | null,
  unsubscribe: vi.fn<() => void>(),
  onMessage: vi.fn<(_messaging: unknown, listener: (payload: PushPayload) => void) => () => void>(),
  getFcmMessaging: vi.fn<() => Promise<unknown>>(),
  getFcmRegistrationToken: vi.fn<() => Promise<string | null>>(),
  registerToken: vi.fn<(payload: { token: string }) => Promise<void>>(),
}));

vi.mock('../../app/fonts', () => ({ pretendard: { variable: 'pretendard' } }));

vi.mock('@/_app/providers', () => {
  const Provider = ({ children }: { children: ReactNode }) => children;
  return {
    AuthBootstrapProvider: Provider,
    CarpoolRequestAuthCacheSync: () => null,
    ClarityProvider: Provider,
    GoogleAnalytics: () => null,
    LoginRequiredProvider: Provider,
    MockApiProvider: Provider,
    PushNotificationClickHandler: () => null,
    QueryProvider: Provider,
    SnackbarProvider: Provider,
  };
});

vi.mock('firebase/messaging', () => ({ onMessage: mocks.onMessage }));
vi.mock('@/features/push-token/model/get-fcm-registration-token', () => ({
  getFcmMessaging: mocks.getFcmMessaging,
  getFcmRegistrationToken: mocks.getFcmRegistrationToken,
}));
vi.mock('@/features/push-token/model/use-register-push-token-mutation', () => ({
  useRegisterPushTokenMutation: () => ({ mutateAsync: mocks.registerToken }),
}));

const originalNotification = window.Notification;

function renderRoute(page: string) {
  const rootLayout = RootLayout({ children: <main>{page}</main> });
  return rootLayout.props.children.props.children;
}

beforeEach(() => {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission: 'granted' },
  });
  mocks.onMessage.mockImplementation((_messaging, listener) => {
    mocks.receiveMessage = listener;
    return mocks.unsubscribe;
  });
  mocks.getFcmMessaging.mockResolvedValue({});
  mocks.getFcmRegistrationToken.mockResolvedValue('mock-fcm-token');
  mocks.registerToken.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  useAuthStore.getState().clearTokens();
  vi.clearAllMocks();
  mocks.receiveMessage = null;

  if (originalNotification) {
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: originalNotification,
    });
  } else {
    Reflect.deleteProperty(window, 'Notification');
  }
});

describe('전역 포그라운드 푸시', () => {
  it('로그인 후 메인과 다른 페이지에서 수신을 유지하고 로그아웃 시 구독을 해제한다', async () => {
    const { rerender } = render(renderRoute('메인 페이지'));

    expect(mocks.onMessage).not.toHaveBeenCalled();

    act(() => useAuthStore.getState().setAccessToken('mock-access-token'));

    await waitFor(() => expect(mocks.onMessage).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(mocks.registerToken).toHaveBeenCalledWith({ token: 'mock-fcm-token' }),
    );

    act(() => {
      mocks.receiveMessage?.({ notification: { title: '메인 알림', body: '새 알림이 있어요' } });
    });
    expect(screen.getByRole('status')).toHaveTextContent('메인 알림');

    rerender(renderRoute('알림 페이지'));
    rerender(renderRoute('다른 페이지'));

    expect(mocks.onMessage).toHaveBeenCalledOnce();
    expect(mocks.unsubscribe).not.toHaveBeenCalled();

    act(() => {
      mocks.receiveMessage?.({ notification: { title: '다른 페이지 알림', body: '수신했어요' } });
    });
    expect(screen.getByRole('status')).toHaveTextContent('다른 페이지 알림');

    act(() => useAuthStore.getState().clearTokens());
    await waitFor(() => expect(mocks.unsubscribe).toHaveBeenCalledOnce());
  });
});
