import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SignupPage } from '@/_pages/signup/ui/SignupPage';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  pathname: '/signup',
  replace: vi.fn<(path: string, options?: { scroll?: boolean }) => void>(),
  push: vi.fn<(path: string, options?: { scroll?: boolean }) => void>(),
  searchParams: new URLSearchParams({ step: '1' }),
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
  navigation.searchParams = new URLSearchParams({ step: '1' });
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

describe('SignupPage profile step', () => {
  it('프로필 이미지를 선택하지 않아도 다음 단계로 진행할 수 있도록 선택 항목으로 표시한다', () => {
    renderSignupPage();

    expect(screen.getByText('프로필 이미지')).toBeInTheDocument();
    expect(screen.getByText('선택')).toBeInTheDocument();
    expect(screen.getByLabelText('프로필 이미지 선택 파일')).not.toBeRequired();
  });

  it('필드 오류가 표시된 뒤 입력을 변경하면 유효성을 다시 검사한다', async () => {
    renderSignupPage();

    expect(screen.queryByText('한글, 영문, 숫자만 사용할 수 있어요.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => {
      expect(screen.getByText('한글, 영문, 숫자만 사용할 수 있어요.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: '닉네임' }), {
      target: { value: '제리' },
    });

    await waitFor(() => {
      expect(screen.queryByText('한글, 영문, 숫자만 사용할 수 있어요.')).not.toBeInTheDocument();
    });
  });

  it('닉네임이 12자를 초과하면 길이 오류 메시지를 표시한다', async () => {
    renderSignupPage();

    fireEvent.click(screen.getByRole('button', { name: '다음' }));

    await waitFor(() => {
      expect(screen.getByText('한글, 영문, 숫자만 사용할 수 있어요.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('textbox', { name: '닉네임' }), {
      target: { value: '가'.repeat(13) },
    });

    await waitFor(() => {
      expect(screen.getByText('2~12자로 입력해주세요')).toBeInTheDocument();
    });
  });
});
