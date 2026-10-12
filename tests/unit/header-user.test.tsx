import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { HeaderUser } from '@/features/header-user';
import { server } from '@/shared/api/mocks/server';

const replace = vi.fn<(path: string) => void>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn<(path: string) => void>(), replace }),
}));

function renderHeaderUser() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <HeaderUser />
    </QueryClientProvider>,
  );
  return queryClient;
}

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  useAuthStore.getState().clearTokens();
  replace.mockClear();
});

describe('HeaderUser', () => {
  it('로그인한 사용자가 프로필 아바타를 클릭하면 사용자 메뉴를 연다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));

    expect(screen.getByRole('menu')).toHaveAttribute('aria-label', '사용자 메뉴');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '회원 탈퇴' })).toBeInTheDocument();
  });

  it('로그아웃 메뉴를 누르면 오류 영역을 확보한 neutral 확인 Dialog를 열고 취소로 닫는다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));

    expect(screen.getByRole('dialog', { name: '로그아웃하시겠어요?' })).toBeInTheDocument();
    expect(screen.getByTestId('account-action-error')).toHaveClass('h-[38px]');
    expect(screen.getByTestId('account-action-error')).toBeEmptyDOMElement();
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
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '회원 탈퇴' }));

    expect(screen.getByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).toBeInTheDocument();
    expect(
      screen.getByText('탈퇴하더라도 작성한 글과 채팅 내역은 다른사람들에게 보여요.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('account-action-error')).toHaveClass('h-[38px]');
    expect(screen.getByTestId('dialog-footer')).toHaveClass('flex-row');
    expect(screen.getByRole('button', { name: '탈퇴하기' })).toHaveClass(
      'bg-[var(--color-bg-critical-solid)]',
    );

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByRole('dialog', { name: '정말 탈퇴하시겠어요?' })).not.toBeInTheDocument();
  });

  it('로그아웃 확인 시 토큰 헤더 없이 DELETE를 호출하고 인증 상태를 비운다', async () => {
    const user = userEvent.setup();
    const requestSpy = vi.fn<(request: Request) => void>();
    server.use(
      http.delete('*/auth/sessions', ({ request }) => {
        requestSpy(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    useAuthStore.getState().setAccessToken('mock-access-token');
    const queryClient = renderHeaderUser();
    queryClient.setQueryData(['private'], { value: true });

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));
    await user.click(screen.getByRole('button', { name: '로그아웃하기' }));

    await waitFor(() => expect(requestSpy).toHaveBeenCalledOnce());
    expect(requestSpy.mock.calls[0][0].headers.get('authorization')).toBeNull();
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBeNull());
    expect(queryClient.getQueryData(['private'])).toBeUndefined();
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('탈퇴 확인 시 Bearer 토큰으로 DELETE를 호출하고 인증 상태를 비운다', async () => {
    const user = userEvent.setup();
    const requestSpy = vi.fn<(request: Request) => void>();
    server.use(
      http.delete('*/users/me', ({ request }) => {
        requestSpy(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    useAuthStore.getState().setAccessToken('mock-access-token');
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '회원 탈퇴' }));
    await user.click(screen.getByRole('button', { name: '탈퇴하기' }));

    await waitFor(() => expect(requestSpy).toHaveBeenCalledOnce());
    expect(requestSpy.mock.calls[0][0].headers.get('authorization')).toBe(
      'Bearer mock-access-token',
    );
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBeNull());
    expect(replace).toHaveBeenCalledWith('/');
  });

  it('탈퇴가 제한되면 서버 메시지를 표시하고 로그인 상태를 유지한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete('*/users/me', () =>
        HttpResponse.json(
          {
            message: '참여 중인 택시팟이 있어 탈퇴할 수 없습니다',
            error: { code: 'ACTIVE_TAXI_POT_EXISTS', field: null },
          },
          { status: 409 },
        ),
      ),
    );
    useAuthStore.getState().setAccessToken('mock-access-token');
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '회원 탈퇴' }));
    const errorSlot = screen.getByTestId('account-action-error');
    await user.click(screen.getByRole('button', { name: '탈퇴하기' }));

    expect(
      await screen.findByText('참여 중인 택시팟이 있어 탈퇴할 수 없습니다'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('account-action-error')).toBe(errorSlot);
    expect(errorSlot).toHaveClass('h-[38px]');
    expect(screen.getByText('참여 중인 택시팟이 있어 탈퇴할 수 없습니다')).toHaveClass(/t4Regular/);
    expect(useAuthStore.getState().accessToken).toBe('mock-access-token');
    expect(replace).not.toHaveBeenCalled();
  });

  it('로그아웃 요청이 실패하면 오류를 표시하고 로그인 상태를 유지한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete('*/auth/sessions', () =>
        HttpResponse.json(
          {
            message: '서버 오류가 발생했습니다',
            error: { code: 'INTERNAL_SERVER_ERROR', field: null },
          },
          { status: 500 },
        ),
      ),
    );
    useAuthStore.getState().setAccessToken('mock-access-token');
    renderHeaderUser();

    await user.click(screen.getByRole('button', { name: '프로필 메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '로그아웃' }));
    const errorSlot = screen.getByTestId('account-action-error');
    await user.click(screen.getByRole('button', { name: '로그아웃하기' }));

    expect(await screen.findByText('서버 오류가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByTestId('account-action-error')).toBe(errorSlot);
    expect(errorSlot).toHaveClass('h-[38px]');
    expect(screen.getByText('서버 오류가 발생했습니다')).toHaveClass(/t4Regular/);
    expect(useAuthStore.getState().accessToken).toBe('mock-access-token');
    expect(replace).not.toHaveBeenCalled();
  });
});
