import { http, HttpResponse } from 'msw';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginRequiredProvider } from '@/_app/providers';
import { HomePage } from '@/_pages/home';
import { useAuthStore } from '@/entities/auth';
import { MOCK_ACCESS_TOKEN } from '@/shared/api/mocks/mock-utils';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import type { MapCoordinate } from '@/shared/types/common';
import type { MapMarker, MapViewport } from '@/shared/ui/map';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

const mapControls = vi.hoisted(() => ({
  requestCurrentLocation: vi.fn<() => void>(),
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

type MockMapRef = {
  requestCurrentLocation: () => void;
};

class MockIntersectionObserver {
  static callbacks: IntersectionObserverCallback[] = [];

  static trigger() {
    for (const callback of MockIntersectionObserver.callbacks) {
      callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    }
  }

  constructor(callback: IntersectionObserverCallback) {
    MockIntersectionObserver.callbacks.push(callback);
  }

  observe() {}

  disconnect() {}
}

vi.mock('@/shared/ui/map', () => ({
  Map: forwardRef<MockMapRef, MockMapProps>(
    ({ children, markers = [], onMarkerClick, onUserLocationChange, onViewportChange }, ref) => {
      useImperativeHandle(ref, () => mapControls, []);

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
  ),
  MyLocationButton: ({
    className,
    onClick,
  }: Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'onClick'>) => (
    <button aria-label="현재 위치로 이동" className={className} onClick={onClick} type="button" />
  ),
}));

afterEach(() => {
  cleanup();
  MockIntersectionObserver.callbacks = [];
  navigation.push.mockReset();
  mapControls.requestCurrentLocation.mockReset();
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
});

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <LoginRequiredProvider>
          <HomePage />
        </LoginRequiredProvider>
      </QueryClientProvider>,
    ),
  };
}

describe('HomePage', () => {
  it('로그인한 사용자의 프로필 이미지를 홈 Avatar에 표시한다', async () => {
    useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByRole('img', { name: '프로필' })).toHaveAttribute(
        'src',
        'https://cdn.moyeota.app/profile/15.jpg',
      );
    });
  });

  it('비로그인 사용자는 로그인하기 버튼을 표시하고 로그인 페이지로 이동한다', async () => {
    const user = userEvent.setup();

    renderHomePage();

    await user.click(screen.getByRole('button', { name: '로그인하기' }));

    expect(navigation.push).toHaveBeenCalledWith('/login');
  });

  it('로그인한 사용자가 아바타를 클릭하면 사용자 메뉴를 연다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken(MOCK_ACCESS_TOKEN);

    renderHomePage();

    await user.click(await screen.findByRole('button', { name: '프로필 메뉴 열기' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '정보수정하기' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '회원 탈퇴' })).toBeInTheDocument();
  });

  it('지도, 글쓰기 버튼, 바텀시트, 하단 네비게이션을 조합한다', () => {
    renderHomePage();

    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '현재 위치' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { hidden: true, name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByTestId('home-map-controls')).toHaveClass(
      'fixed',
      'z-40',
      'pointer-events-none',
    );
    expect(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' })).toHaveClass(
      'pointer-events-auto',
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

  it('현재 위치 버튼을 누르면 지도에 현재 위치 조회를 요청한다', async () => {
    const user = userEvent.setup();

    renderHomePage();

    await user.click(screen.getByRole('button', { hidden: true, name: '현재 위치로 이동' }));

    expect(mapControls.requestCurrentLocation).toHaveBeenCalledOnce();
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

  it('주변 게시글 조회 오류를 ResultSection으로 표시하고 다시 조회한다', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get('*/nearby-posts', () => {
        requestCount += 1;

        if (requestCount === 1) {
          return HttpResponse.json(
            {
              message: '서버 오류가 발생했습니다',
              error: { code: 'INTERNAL_SERVER_ERROR', field: null },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        });
      }),
    );

    renderHomePage();

    expect(
      await screen.findByRole('heading', { name: '게시글을 불러올 수 없어요' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/게시글을 불러오는 중 오류가 발생했어요/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    await waitFor(() => expect(requestCount).toBe(2));
    expect(
      await screen.findByRole('heading', { name: '등록된 게시글이 없어요' }),
    ).toBeInTheDocument();
  });

  it('주변 게시글이 없으면 게시글 등록 ResultSection을 표시한다', async () => {
    server.use(
      http.get('*/nearby-posts', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], next_cursor: null },
        }),
      ),
    );

    renderHomePage();

    expect(
      await screen.findByRole('heading', { name: '등록된 게시글이 없어요' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '글 등록하기' })).toBeInTheDocument();
  });

  it('핀 목록 조회 오류를 재시도 가능한 Snackbar로 표시한다', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get('*/map-pins', () => {
        requestCount += 1;

        if (requestCount === 1) {
          return HttpResponse.json(
            {
              message: '서버 오류가 발생했습니다',
              error: { code: 'INTERNAL_SERVER_ERROR', field: null },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: { items: [], limit: 500, limit_exceeded: false },
        });
      }),
    );

    renderHomePage();

    expect(await screen.findByRole('status')).toHaveTextContent(
      '핀 목록 조회 중 오류가 발생했어요',
    );

    await user.click(screen.getByRole('button', { name: '다시 시도' }));

    await waitFor(() => expect(requestCount).toBe(2));
    await waitFor(() =>
      expect(screen.queryByText('핀 목록 조회 중 오류가 발생했어요')).not.toBeInTheDocument(),
    );
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

  it('동행모집 상세의 참여자 정보가 null이어도 핀 상세를 표시한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/companion-posts/10', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 10,
            title: '택시 같이 타실 분 구해요',
            content: '판교역에서 강남역까지 같이 이동해요.',
            transport_type: 'TAXI',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            is_expired: false,
            current_count: 1,
            capacity: 3,
            is_full: false,
            author: { nickname: '우림' },
            participants: null,
            chat_room_id: null,
            joined: false,
          },
        }),
      ),
    );

    renderHomePage();
    await user.click(await screen.findByTestId('map-marker-COMPANION-10'));

    expect(await screen.findByText('택시 같이 타실 분 구해요')).toBeInTheDocument();
    expect(screen.getByText('참여자')).toBeInTheDocument();
  });

  it('커뮤니티 게시글 상세에서 하단에 도달하면 다음 댓글 페이지를 조회한다', async () => {
    const user = userEvent.setup();

    const { queryClient } = renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 근처 카페 추천/ }));

    expect(await screen.findByText('저도 궁금해요!')).toBeInTheDocument();
    expect(MockIntersectionObserver.callbacks).not.toHaveLength(0);

    MockIntersectionObserver.trigger();

    await waitFor(() =>
      expect(
        queryClient.getQueryData<{ pages: unknown[] }>(['community-posts', 'comments', 88])?.pages,
      ).toHaveLength(2),
    );
  });

  it('댓글 작성자 정보가 없어도 게시글 상세를 표시한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/community-posts/88/comments', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: 99,
                content: '작성자 정보가 없는 댓글입니다.',
                created_at: '2026-09-03T11:00:00.000Z',
              },
            ],
            next_cursor: null,
          },
        }),
      ),
    );

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 근처 카페 추천/ }));

    expect(await screen.findByText('작성자 정보가 없는 댓글입니다.')).toBeInTheDocument();
  });

  it('커뮤니티 댓글 작성 API를 호출하고 성공 Snackbar를 표시한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken('mock-access-token');

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 근처 카페 추천/ }));

    const input = await screen.findByRole('textbox', { name: '댓글 입력' });
    await user.type(input, '새로 남긴 댓글입니다');
    await user.click(screen.getByRole('button', { name: '댓글 전송' }));

    const snackbar = await screen.findByRole('status');

    expect(snackbar).toHaveTextContent('댓글이 등록되었어요');
    expect(snackbar).toHaveClass('mx-6', 'mb-2', '!w-auto', '!max-w-none');
  });

  it('존재하지 않는 게시글이면 바텀모달을 닫고 Snackbar를 표시한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/companion-posts/10', () =>
        HttpResponse.json(
          {
            message: '존재하지 않는 게시글입니다',
            error: { code: 'POST_NOT_FOUND', field: null },
          },
          { status: 404 },
        ),
      ),
    );

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('존재하지 않는 게시글이에요.')).toBeInTheDocument();
  });

  it('게시글 상세 조회 오류를 ResultSection으로 표시하고 다시 조회한다', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get('*/companion-posts/10', () => {
        requestCount += 1;

        if (requestCount === 1) {
          return HttpResponse.json(
            {
              message: '서버 오류가 발생했습니다',
              error: { code: 'INTERNAL_SERVER_ERROR', field: null },
            },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 10,
            title: '택시 같이 타실 분 구해요!',
            content: '판교역에서 강남역까지 같이 이동해요.',
            author: { nickname: '우림', profile_image_url: null },
            transport_type: 'TAXI',
            departure_at: '2026-08-24T09:40:00.000Z',
            origin_name: '판교역',
            dest_name: '강남역',
            current_count: 2,
            capacity: 4,
            is_expired: false,
            participants: [],
          },
        });
      }),
    );

    renderHomePage();
    await user.click(await screen.findByRole('button', { name: /판교역 → 강남역/ }));

    expect(
      await screen.findByRole('heading', { name: '게시글을 불러올 수 없어요' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    await waitFor(() => expect(requestCount).toBe(2));
    expect(await screen.findByText('택시 같이 타실 분 구해요!')).toBeInTheDocument();
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
