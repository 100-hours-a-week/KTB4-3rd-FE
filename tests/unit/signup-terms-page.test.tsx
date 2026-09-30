import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SignupPage } from '@/_pages/signup/ui/SignupPage';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  pathname: '/signup',
  replace: vi.fn<(path: string, options?: { scroll?: boolean }) => void>(),
  push: vi.fn<(path: string, options?: { scroll?: boolean }) => void>(),
  searchParams: new URLSearchParams({ step: '2' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}));

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  navigation.replace.mockReset();
  navigation.searchParams = new URLSearchParams({ step: '2' });
  useSnackbarStore.getState().reset();
});

function renderSignupPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SignupPage />
    </QueryClientProvider>,
  );
}

describe('SignupPage terms step', () => {
  it('필수 약관을 선택하지 않고 회원가입하면 스낵바를 표시한다', async () => {
    renderSignupPage();

    fireEvent.click(screen.getByRole('button', { name: '회원가입하기' }));

    await waitFor(() => {
      expect(useSnackbarStore.getState()).toMatchObject({
        description: '필수 약관에 동의해주세요.',
        open: true,
        type: 'critical',
      });
    });
    expect(navigation.replace).not.toHaveBeenCalledWith('/', { scroll: false });
  });
});
