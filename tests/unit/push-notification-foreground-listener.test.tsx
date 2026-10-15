import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { PushNotificationForegroundListener } from '@/features/push-token';

const mocks = vi.hoisted(() => ({
  receiveMessage: null as
    | ((payload: {
        notification?: { title?: string; body?: string };
        data?: Record<string, string>;
      }) => void)
    | null,
  unsubscribe: vi.fn<() => void>(),
}));

vi.mock('firebase/messaging', () => ({
  onMessage: vi.fn<(_messaging: unknown, listener: typeof mocks.receiveMessage) => () => void>(
    (_messaging, listener) => {
      mocks.receiveMessage = listener;
      return mocks.unsubscribe;
    },
  ),
}));

vi.mock('@/features/push-token/model/get-fcm-registration-token', () => ({
  getFcmMessaging: vi.fn<() => Promise<unknown>>(async () => ({})),
  getFcmRegistrationToken: vi.fn<() => Promise<string | null>>(),
}));

const originalNotification = window.Notification;

function setNotificationPermission(permission: NotificationPermission) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission },
  });
}

beforeEach(() => {
  setNotificationPermission('granted');
  useAuthStore.getState().setAccessToken('mock-access-token');
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

describe('PushNotificationForegroundListener', () => {
  it('포그라운드 푸시의 제목과 내용을 앱 UI로 표시한다', async () => {
    render(<PushNotificationForegroundListener />);

    await act(async () => Promise.resolve());
    expect(mocks.receiveMessage).toBeTypeOf('function');

    act(() => {
      mocks.receiveMessage?.({
        notification: { title: '모여타', body: '우림님이 댓글을 남겼어요' },
        data: { notification_id: '900', type: 'COMMENT_CREATED', target_post_id: '88' },
      });
    });

    expect(screen.getByRole('status')).toHaveTextContent('모여타');
    expect(screen.getByRole('status')).toHaveTextContent('우림님이 댓글을 남겼어요');
  });

  it('같은 notification_id의 중복 푸시는 두 번 표시하지 않는다', async () => {
    render(<PushNotificationForegroundListener />);

    await act(async () => Promise.resolve());

    const payload = {
      notification: { title: '모여타', body: '우림님이 댓글을 남겼어요' },
      data: { notification_id: '900', type: 'COMMENT_CREATED', target_post_id: '88' },
    };

    act(() => {
      mocks.receiveMessage?.(payload);
      mocks.receiveMessage?.(payload);
    });

    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('로그아웃 상태에서는 FCM 메시지 수신을 구독하지 않는다', async () => {
    useAuthStore.getState().clearTokens();

    render(<PushNotificationForegroundListener />);
    await act(async () => Promise.resolve());

    expect(mocks.receiveMessage).toBeNull();
  });

  it('브라우저 알림 권한 상태와 무관하게 로그인 상태에서는 수신을 구독한다', async () => {
    setNotificationPermission('default');

    render(<PushNotificationForegroundListener />);
    await act(async () => Promise.resolve());

    expect(mocks.receiveMessage).toBeTypeOf('function');
  });
});
