import { http, HttpResponse } from 'msw';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider } from '@/_app/providers';
import { HomePage } from '@/_pages/home';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapMarker, MapViewport } from '@/shared/ui/map';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: navigation.push }),
}));

type MockMapProps = {
  children?: ReactNode;
  markers?: readonly MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  onUserLocationChange?: (coordinate: MapCoordinate) => void;
  onViewportChange?: (viewport: MapViewport) => void;
};

vi.mock('@/shared/ui/map', () => ({
  Map: ({
    children,
    markers = [],
    onMarkerClick,
    onUserLocationChange,
    onViewportChange,
  }: MockMapProps) => {
    useEffect(() => {
      onUserLocationChange?.({ lat: 37.3945, lng: 127.1112 });
      onViewportChange?.({
        northEast: { lat: 37.6, lng: 127.2 },
        northWest: { lat: 37.6, lng: 127 },
        southEast: { lat: 37.3, lng: 127.2 },
        southWest: { lat: 37.3, lng: 127 },
      });
    }, [onUserLocationChange, onViewportChange]);

    return (
      <div data-testid="map">
        {markers.map((marker) => (
          <button
            aria-label={marker.title}
            data-testid={`map-marker-${marker.id}`}
            key={marker.id}
            onClick={() => onMarkerClick?.(marker)}
            type="button"
          />
        ))}
        {children}
      </div>
    );
  },
  MyLocationButton: ({ className }: { className?: string }) => (
    <button aria-label="현재 위치로 이동" className={className} type="button" />
  ),
}));

afterEach(() => {
  cleanup();
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
});

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginRequiredProvider>
        <HomePage />
      </LoginRequiredProvider>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    renderHomePage();

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'z-20',
    );
    expect(screen.getByRole('heading', { name: '근처 핀 게시글' })).toBeInTheDocument();
    const bottomNav = screen.getByRole('navigation', { hidden: true, name: '주요 메뉴' });

    expect(bottomNav).toBeInTheDocument();
    expect(bottomNav).toHaveClass('!fixed', '!max-w-[393px]', '!-translate-x-1/2');
  });

  it('글쓰기 버튼을 누르면 게시글 등록 위치선택 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderHomePage();

    await user.click(screen.getByRole('button', { hidden: true, name: '글쓰기' }));

    expect(navigation.push).toHaveBeenCalledWith('/post/create/location');
  });

  it('지도 핀 API 응답을 지도 마커로 렌더링한다', async () => {
    renderHomePage();

    expect(await screen.findByTestId('map-marker-COMPANION-10')).toBeInTheDocument();
    expect(screen.getByTestId('map-marker-COMMUNITY-88')).toBeInTheDocument();
  });

  it('주변 게시글 API 응답을 바텀시트에 렌더링한다', async () => {
    renderHomePage();

    expect(await screen.findByRole('button', { name: /판교역 → 강남역/ })).toBeInTheDocument();
    expect(screen.getByText('판교역 근처 카페 추천')).toBeInTheDocument();
    expect(screen.getByText(/택시 · 320m/)).toBeInTheDocument();
  });

  it('API로 받은 게시글을 선택하면 상세 API 응답으로 바텀모달을 연다', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));

    const modal = await screen.findByRole('dialog', { name: '바텀모달' });

    expect(modal).toBeInTheDocument();
    expect(modal).toHaveStyle({
      bottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 8px)',
    });
    expect(await screen.findByText('택시 같이 타실 분 구해요')).toBeInTheDocument();
    expect(screen.getByText('판교역')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '근처 핀 게시글' })).not.toBeInTheDocument();
  });

  it('커뮤니티 게시글 상세에 댓글 목록을 표시하고 다음 페이지를 조회한다', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 근처 카페 추천/ }));

    expect(await screen.findByText('저도 궁금해요!')).toBeInTheDocument();
    const loadMoreButton = screen.getByRole('button', { name: '댓글 더보기' });

    await user.click(loadMoreButton);

    await waitFor(() => expect(loadMoreButton).not.toBeInTheDocument());
  });

  it('커뮤니티 댓글 작성 API를 호출하고 성공 Snackbar를 표시한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 근처 카페 추천/ }));

    const input = await screen.findByRole('textbox', { name: '댓글 입력' });
    await user.type(input, '새로 남긴 댓글입니다');
    await user.click(screen.getByRole('button', { name: '댓글 전송' }));

    expect(await screen.findByRole('status')).toHaveTextContent('댓글이 등록되었어요');
  });

  it('동행모집 상세에서 채팅 참여에 성공하면 응답의 채팅방으로 이동한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));
    await user.click(await screen.findByRole('button', { name: '채팅 참여하기' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/chatroom/501'));
  });

  it('채팅 참여 API 오류를 버튼 위 Snackbar로 표시한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');
    server.use(
      http.post('*/companion-posts/10/participants', () =>
        HttpResponse.json(
          {
            message: '이미 참여 중인 게시글입니다',
            error: { code: 'ALREADY_JOINED', field: null },
          },
          { status: 409 },
        ),
      ),
    );

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));
    const joinButton = await screen.findByRole('button', { name: '채팅 참여하기' });

    await user.click(joinButton);

    const snackbar = await screen.findByRole('status');

    expect(snackbar).toHaveTextContent('이미 참여 중인 게시글입니다');
    expect(snackbar.nextElementSibling).toBe(joinButton);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('가입 완료 Snackbar를 홈 하단에 표시한다', () => {
    useSnackbarStore.getState().showSnackbar('가입이 완료되었어요', 'positive');

    renderHomePage();

    const snackbar = screen.getByText('가입이 완료되었어요').closest('[role="status"]');

    expect(snackbar).toBeInTheDocument();
    expect(snackbar).toHaveClass('z-[2147483647]');
  });
});
