import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { HeaderUser } from '@/features/header-user';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn<(path: string) => void>() }),
}));

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  useAuthStore.getState().clearTokens();
});

describe('HeaderUser', () => {
  it('로그인한 사용자가 프로필 아바타를 클릭하면 사용자 메뉴를 연다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    render(<HeaderUser />);

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));

    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', '사용자 메뉴');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '회원 탈퇴' })).toBeInTheDocument();
  });
});
