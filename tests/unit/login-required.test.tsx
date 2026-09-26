import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { useRequireAuth } from '@/features/login-required';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

function ProtectedAction({ onAuthenticated }: { onAuthenticated: () => void }) {
  const { requireAuth } = useRequireAuth();

  return (
    <button type="button" onClick={() => requireAuth(onAuthenticated)}>
      보호된 기능
    </button>
  );
}

function renderProtectedAction(onAuthenticated = vi.fn<() => void>()) {
  return render(
    <LoginRequiredProvider>
      <ProtectedAction onAuthenticated={onAuthenticated} />
    </LoginRequiredProvider>,
  );
}

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
});

describe('useRequireAuth', () => {
  it('로그인 상태에서는 보호된 동작을 실행한다', () => {
    const onAuthenticated = vi.fn<() => void>();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderProtectedAction(onAuthenticated);
    fireEvent.click(screen.getByRole('button', { name: '보호된 기능' }));

    expect(onAuthenticated).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: '로그인이 필요해요' })).not.toBeInTheDocument();
  });

  it('비로그인 상태에서는 동작 대신 로그인 유도 Dialog를 보여준다', () => {
    const onAuthenticated = vi.fn<() => void>();

    renderProtectedAction(onAuthenticated);
    fireEvent.click(screen.getByRole('button', { name: '보호된 기능' }));

    expect(onAuthenticated).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '로그인이 필요해요' })).toBeInTheDocument();
    expect(screen.getByText('로그인 페이지로 이동할까요?')).toBeInTheDocument();
  });

  it('로그인 유도 Dialog에서 로그인하러가기를 누르면 로그인 화면으로 이동한다', () => {
    renderProtectedAction();
    fireEvent.click(screen.getByRole('button', { name: '보호된 기능' }));
    fireEvent.click(screen.getByRole('button', { name: '로그인하러가기' }));

    expect(navigation.push).toHaveBeenCalledWith('/login');
  });
});
