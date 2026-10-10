import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MapProps, MapRef, MyLocationButtonProps } from '@/shared/ui/map';
import { LoginRequiredProvider, SnackbarProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { MatchingPage } from '@/_pages/matching';

const mocks = vi.hoisted(() => ({
  currentLocation: vi.fn<() => void>(),
  navigation: {
    push: vi.fn<(path: string) => void>(),
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/matching',
  useRouter: () => mocks.navigation,
}));

vi.mock('@/features/user-profile', () => ({
  useCurrentUserQuery: () => ({ data: undefined }),
}));

vi.mock('@/features/header-user', () => ({
  HeaderUser: () => null,
}));

vi.mock('@/shared/ui/map', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');

  const MockMap = forwardRef<MapRef, MapProps>(({ className }, ref) => {
    useImperativeHandle(ref, () => ({
      requestCurrentLocation: mocks.currentLocation,
      requestLocationPermission: vi.fn<() => void>(),
    }));

    return createElement('div', { className });
  });

  return {
    DEFAULT_MAP_CENTER: { lat: 37.5665, lng: 126.978 },
    Map: MockMap,
    MyLocationButton: ({ onClick }: MyLocationButtonProps) =>
      createElement('button', { 'aria-label': '현재 위치로 이동', onClick, type: 'button' }),
  };
});

function renderMatchingPage() {
  return render(
    <SnackbarProvider>
      <LoginRequiredProvider>
        <MatchingPage />
      </LoginRequiredProvider>
    </SnackbarProvider>,
  );
}

afterEach(() => {
  cleanup();
  mocks.navigation.push.mockReset();
  mocks.currentLocation.mockReset();
  useAuthStore.getState().clearTokens();
});

describe('MatchingPage', () => {
  it('매칭 홈을 공개 화면으로 표시하고 지도·하단 메뉴를 렌더링한다', () => {
    renderMatchingPage();

    expect(screen.getByRole('region', { name: '매칭 지도' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '주요 메뉴' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '로그인이 필요해요' })).not.toBeInTheDocument();
  });

  it.each([
    ['카풀 등록', '/carpools/new'],
    ['택시팟 찾기', '/taxi-pots/new'],
  ])('%s는 로그인 확인 후 등록 경로로 이동한다', async (label, path) => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderMatchingPage();
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));
    await user.click(screen.getByRole('button', { name: label }));

    expect(mocks.navigation.push).toHaveBeenCalledExactlyOnceWith(path);
  });

  it('FAB를 Escape로 닫으면 열기 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();
    renderMatchingPage();

    const trigger = screen.getByRole('button', { name: '매칭 메뉴 열기' });

    await user.click(trigger);
    expect(screen.getByRole('button', { name: '카풀 등록' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(trigger).toHaveFocus();
  });

  it('requires login before navigating from a matching action', async () => {
    const user = userEvent.setup();

    renderMatchingPage();
    await user.click(screen.getByRole('button', { name: '매칭 메뉴 열기' }));
    await user.click(screen.getByRole('button', { name: '카풀 등록' }));

    expect(await screen.findByRole('dialog', { name: '로그인이 필요해요' })).toBeInTheDocument();
    expect(mocks.navigation.push).not.toHaveBeenCalled();
  });

  it('현재 위치 버튼은 지도에 위치 이동을 요청한다', async () => {
    const user = userEvent.setup();
    renderMatchingPage();

    await user.click(screen.getByRole('button', { name: '현재 위치로 이동' }));

    expect(mocks.currentLocation).toHaveBeenCalledOnce();
  });
});
