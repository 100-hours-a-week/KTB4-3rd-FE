import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PushNotificationClickHandler } from '@/features/push-token';

const navigation = {
  replace: vi.fn<(path: string, options: { scroll: boolean }) => void>(),
};
const auth = { getAccessToken: vi.fn<() => Promise<string>>() };
const notificationApi = {
  markNotificationRead: vi.fn<(accessToken: string, notificationId: number) => Promise<unknown>>(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

vi.mock('@/entities/auth', () => ({
  getAccessToken: () => auth.getAccessToken(),
}));

vi.mock('@/shared/api/notifications', () => ({
  markNotificationRead: (accessToken: string, notificationId: number) =>
    notificationApi.markNotificationRead(accessToken, notificationId),
}));

describe('PushNotificationClickHandler', () => {
  beforeEach(() => {
    navigation.replace.mockReset();
    auth.getAccessToken.mockReset().mockResolvedValue('access-token');
    notificationApi.markNotificationRead.mockReset().mockResolvedValue({});
    window.history.replaceState({}, '', '/posts/88?fcm_notification_id=900&source=push#comments');
  });

  it('marks the pushed notification as read and removes only its query parameter', async () => {
    render(<PushNotificationClickHandler />);

    await waitFor(() => {
      expect(notificationApi.markNotificationRead).toHaveBeenCalledWith('access-token', 900);
    });
    expect(navigation.replace).toHaveBeenCalledWith('/posts/88?source=push#comments', {
      scroll: false,
    });
  });

  it('ignores an invalid notification id', async () => {
    window.history.replaceState({}, '', '/posts/88?fcm_notification_id=invalid');

    render(<PushNotificationClickHandler />);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/posts/88', { scroll: false });
    });
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(notificationApi.markNotificationRead).not.toHaveBeenCalled();
  });
});
