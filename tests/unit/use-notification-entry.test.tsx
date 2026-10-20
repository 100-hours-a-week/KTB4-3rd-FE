import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getFcmRegistrationToken } from '@/features/push-token/model/get-fcm-registration-token';
import { useRegisterPushTokenMutation } from '@/features/push-token/model/use-register-push-token-mutation';
import { useNotificationEntry } from '@/features/push-token/model/use-notification-entry';

vi.mock('@/features/push-token/model/get-fcm-registration-token', () => ({
  getFcmRegistrationToken: vi.fn<() => Promise<string | null>>(),
}));

vi.mock('@/features/push-token/model/use-register-push-token-mutation', () => ({
  useRegisterPushTokenMutation: vi.fn<
    () => {
      mutateAsync: (payload: { token: string }) => Promise<void>;
    }
  >(),
}));

const mutateAsync = vi.fn<(payload: { token: string }) => Promise<void>>();
const requestPermission = vi.fn<() => Promise<NotificationPermission>>();

function setNotification(permission: NotificationPermission) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission, requestPermission },
  });
}

describe('useNotificationEntry', () => {
  const onOpenNotifications = vi.fn<() => void>();

  beforeEach(() => {
    setNotification('default');
    vi.mocked(useRegisterPushTokenMutation).mockReturnValue({ mutateAsync } as never);
    vi.mocked(getFcmRegistrationToken).mockResolvedValue('mock-fcm-token');
    mutateAsync.mockResolvedValue(undefined);
    requestPermission.mockResolvedValue('granted');
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('알림 권한이 아직 결정되지 않았으면 종 버튼 클릭 시 안내 dialog를 연다', () => {
    const { result } = renderHook(() => useNotificationEntry({ onOpenNotifications }));

    act(() => result.current.onNotificationClick());

    expect(result.current.isPermissionDialogOpen).toBe(true);
    expect(onOpenNotifications).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('알림 받기를 누르면 브라우저 권한을 요청하고 허용 시 토큰을 등록한다', async () => {
    const { result } = renderHook(() => useNotificationEntry({ onOpenNotifications }));

    act(() => result.current.onEnable());

    expect(requestPermission).toHaveBeenCalledOnce();
    await waitFor(() => expect(onOpenNotifications).toHaveBeenCalledOnce());
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ token: 'mock-fcm-token' }));
  });

  it('권한 허용 상태에서는 안내 dialog 없이 알림함으로 이동한다', () => {
    setNotification('granted');
    const { result } = renderHook(() => useNotificationEntry({ onOpenNotifications }));

    act(() => result.current.onNotificationClick());

    expect(onOpenNotifications).toHaveBeenCalledOnce();
    expect(result.current.isPermissionDialogOpen).toBe(false);
  });

  it('나중에를 선택하면 권한 요청 없이 알림함으로 이동한다', () => {
    const { result } = renderHook(() => useNotificationEntry({ onOpenNotifications }));

    act(() => result.current.onDefer());

    expect(onOpenNotifications).toHaveBeenCalledOnce();
    expect(requestPermission).not.toHaveBeenCalled();
  });
});
