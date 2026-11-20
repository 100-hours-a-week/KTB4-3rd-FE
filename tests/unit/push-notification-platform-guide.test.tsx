import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PushNotificationPlatformGuide } from '@/features/push-token';

describe('PushNotificationPlatformGuide', () => {
  it('shows macOS and iPhone notification setup instructions', () => {
    render(<PushNotificationPlatformGuide />);

    expect(screen.getByText('푸시 알림이 오지 않나요?')).toBeInTheDocument();
    expect(screen.getByText('Mac에서 Chrome을 사용하는 경우')).toBeInTheDocument();
    expect(screen.getByText('iPhone에서 사용하는 경우')).toBeInTheDocument();
    expect(screen.getByText(/홈 화면에 추가한 웹 앱에서 사용할 수 있습니다/)).toBeInTheDocument();
  });
});
