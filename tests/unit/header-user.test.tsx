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

  it('로그아웃 메뉴를 누르면 본문 없는 neutral 확인 Dialog를 열고 취소로 닫는다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    render(<HeaderUser />);

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    expect(screen.getByRole('dialog', { name: '로그아웃하시겠어요?' })).toBeInTheDocument();
    expect(screen.queryByTestId('dialog-body')).not.toBeInTheDocument();
    expect(screen.getByTestId('dialog-footer')).toHaveClass('flex-row');
    expect(screen.getByRole('button', { name: '로그아웃하기' })).toHaveClass(
      'bg-[var(--color-bg-neutral-inverted)]',
    );

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('dialog', { name: '로그아웃하시겠어요?' })).not.toBeInTheDocument();
  });

  it('회원 탈퇴 메뉴를 누르면 경고 Dialog를 열고 취소로 닫는다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    render(<HeaderUser />);

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '회원 탈퇴' }));

    expect(screen.getByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).toBeInTheDocument();
    expect(
      screen.getByText('탈퇴하더라도 작성한 글과 채팅 내역은 다른사람들에게 보여요.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('dialog-footer')).toHaveClass('flex-row');
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toHaveClass(
      'bg-[var(--color-bg-critical-solid)]',
    );

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).not.toBeInTheDocument();
  });
});
