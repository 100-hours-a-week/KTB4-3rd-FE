import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { KakaoLoginButton } from '@/features/login/ui/KakaoLoginButton';

const { startKakaoLogin } = vi.hoisted(() => ({
  startKakaoLogin: vi.fn<() => void>(),
}));

vi.mock('@/features/login/model/use-kakao-login', () => ({
  useKakaoLogin: () => startKakaoLogin,
}));

afterEach(() => {
  cleanup();
  startKakaoLogin.mockReset();
});

describe('KakaoLoginButton', () => {
  it('클릭하면 카카오 로그인 시작 동작을 호출한다', async () => {
    const user = userEvent.setup();

    render(<KakaoLoginButton />);

    await user.click(screen.getByRole('button', { name: '카카오 로그인' }));

    expect(startKakaoLogin).toHaveBeenCalledOnce();
  });
});
