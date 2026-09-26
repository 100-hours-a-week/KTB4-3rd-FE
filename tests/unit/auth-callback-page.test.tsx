import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthCallbackPage } from '@/_pages/auth-callback/ui/AuthCallbackPage';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  replace: vi.fn<(path: string) => void>(),
  searchParams: new URLSearchParams(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}));

afterEach(() => {
  cleanup();
  navigation.replace.mockReset();
  navigation.searchParams = new URLSearchParams();
  useSnackbarStore.getState().reset();
});

describe('AuthCallbackPage', () => {
  it('신규 회원이면 회원가입 페이지로 이동한다', async () => {
    navigation.searchParams = new URLSearchParams({ status: 'signup_required' });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/signup');
    });
  });

  it('로그인 실패면 카카오 오류 메시지를 보여준다', () => {
    navigation.searchParams = new URLSearchParams({
      error: 'access_denied',
      error_description: '사용자가 로그인을 취소했습니다',
    });

    render(<AuthCallbackPage />);

    expect(
      screen.getByRole('heading', { name: '사용자가 로그인을 취소했습니다' }),
    ).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('기존 회원이면 홈으로 이동하고 로그인 완료 Snackbar를 준비한다', async () => {
    navigation.searchParams = new URLSearchParams({ status: 'ok' });

    render(<AuthCallbackPage />);

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/');
    });
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '로그인했어요',
      open: true,
      type: 'positive',
    });
  });
});
