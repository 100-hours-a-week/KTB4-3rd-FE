import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';

import type { MapProps, MapRef, MyLocationButtonProps } from '@/shared/ui/map';
import { LoginRequiredProvider, QueryProvider, SnackbarProvider } from '@/_app/providers';
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

vi.mock('@/shared/ui/bottom-sheet', async () => {
  const { createElement, useEffect, useRef } = await import('react');

  return {
    BottomSheet: ({
      children,
      onScrollElementChange,
      scrollContentKey,
    }: {
      children: React.ReactNode;
      onScrollElementChange?: (element: HTMLElement | null) => void;
      scrollContentKey?: string | number;
    }) => {
      const scrollRoot = useRef<HTMLDivElement>(null);
      useEffect(() => {
        onScrollElementChange?.(scrollRoot.current);
        return () => onScrollElementChange?.(null);
      }, [onScrollElementChange]);

      return createElement(
        'div',
        {
          'data-testid': 'bottom-sheet-content',
          'data-scroll-content-key': scrollContentKey,
          ref: scrollRoot,
        },
        children,
      );
    },
  };
});

vi.mock('@/shared/ui/map', async () => {
  const { createElement, forwardRef, useImperativeHandle } = await import('react');

  const MockMap = forwardRef<MapRef, MapProps>(({ className, markers, onViewportChange }, ref) => {
    useImperativeHandle(ref, () => ({
      requestCurrentLocation: mocks.currentLocation,
      requestLocationPermission: vi.fn<() => void>(),
    }));

    useEffect(() => {
      onViewportChange?.(
        {
          northEast: { lat: 37.57, lng: 126.99 },
          northWest: { lat: 37.57, lng: 126.96 },
          southEast: { lat: 37.55, lng: 126.99 },
          southWest: { lat: 37.55, lng: 126.96 },
        },
        'initial',
      );
    }, [onViewportChange]);

    return createElement('div', {
      className,
      'data-testid': 'matching-map',
      'data-markers': markers?.length ?? 0,
    });
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
    <QueryProvider>
      <SnackbarProvider>
        <LoginRequiredProvider>
          <MatchingPage />
        </LoginRequiredProvider>
      </SnackbarProvider>
    </QueryProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

  it('viewport 기반 카풀 목록과 지도 핀을 조회해 표시한다', async () => {
    renderMatchingPage();

    const carpoolList = await screen.findByLabelText('주변 카풀');
    expect(carpoolList).toHaveTextContent('서울역 2번 출구 → 유스페이스1');
    expect(screen.getByTestId('matching-map')).toHaveAttribute('data-markers', '2');
    expect(screen.getByLabelText('주변 카풀')).toBeInTheDocument();
  });

  it('실제 BottomSheet scroll root에서 다음 카풀 페이지를 자동으로 요청한다', async () => {
    const observerConfigs: IntersectionObserverInit[] = [];
    const observerCallbacks: IntersectionObserverCallback[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn<(target: Element) => void>();
        disconnect = vi.fn<() => void>();

        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          observerCallbacks.push(callback);
          observerConfigs.push(options ?? {});
        }
      },
    );

    renderMatchingPage();
    const list = await screen.findByLabelText('주변 카풀');
    const scrollElement = screen.getByTestId('bottom-sheet-content');
    await waitFor(() => expect(observerCallbacks.length).toBeGreaterThan(0));

    expect(observerConfigs[0]?.root).toBe(scrollElement);
    observerCallbacks[0]?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(await screen.findByText('서울역 → 판교역')).toBeInTheDocument();
    expect(list).toHaveTextContent('서울역 → 판교역');
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
