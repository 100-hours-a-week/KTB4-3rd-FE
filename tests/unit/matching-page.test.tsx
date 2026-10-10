import { http, HttpResponse } from 'msw';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';

import type { MapProps, MapRef, MyLocationButtonProps } from '@/shared/ui/map';
import { LoginRequiredProvider, QueryProvider, SnackbarProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { MatchingPage } from '@/_pages/matching';
import { server } from '@/shared/api/mocks/server';

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

  const MockMap = forwardRef<MapRef, MapProps>(
    ({ className, markers, onMarkerClick, onViewportChange }, ref) => {
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

      return createElement(
        'div',
        { className, 'data-testid': 'matching-map', 'data-markers': markers?.length ?? 0 },
        ...(markers ?? []).map((marker) =>
          createElement(
            'button',
            { key: marker.id, onClick: () => onMarkerClick?.(marker), type: 'button' },
            `카풀 게시글 ${marker.id}`,
          ),
        ),
      );
    },
  );

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
  server.resetHandlers();
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

  it('핀 없는 주변 카풀을 선택해도 지도와 목록을 유지하며 상세를 연다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/carpools/88', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 88,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역 2번 출구',
            dest_name: '유스페이스1',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 1,
            capacity: 3,
            is_full: false,
            participants: [],
          },
        }),
      ),
    );

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: /서울역 2번 출구 → 유스페이스1/ }));

    expect(await screen.findByText('참여자')).toBeInTheDocument();
    expect(screen.getByTestId('matching-map')).toHaveAttribute('data-markers', '2');
    expect(screen.getByLabelText('주변 카풀')).toBeInTheDocument();
  });

  it('상세 조회가 404면 선택된 카풀만 닫고 주변 목록으로 돌아간다', async () => {
    const user = userEvent.setup();
    renderMatchingPage();

    await user.click(await screen.findByRole('button', { name: /서울역 2번 출구 → 유스페이스1/ }));

    expect(await screen.findByText('카풀 게시글을 찾을 수 없어요.')).toBeInTheDocument();
    expect(screen.getByLabelText('주변 카풀')).toBeInTheDocument();
    expect(screen.getByTestId('matching-map')).toHaveAttribute('data-markers', '2');
  });

  it('지도의 카풀 핀을 누르면 같은 카풀 상세를 연다', async () => {
    const user = userEvent.setup();

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: '카풀 게시글 51' }));

    expect(await screen.findByText('참여자')).toBeInTheDocument();
    expect(screen.getByTestId('matching-map')).toHaveAttribute('data-markers', '2');
  });

  it('상세를 닫으면 같은 조회 조건에서 주변 카풀 목록 위치를 복원한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('*/carpools/88', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 88,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역 2번 출구',
            dest_name: '유스페이스1',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 1,
            capacity: 3,
            is_full: false,
            participants: [],
          },
        }),
      ),
    );
    renderMatchingPage();
    const list = await screen.findByLabelText('주변 카풀');
    const item = within(list).getByRole('button', { name: /유스페이스1/ });
    const scrollRoot = screen.getByTestId('bottom-sheet-content');
    scrollRoot.scrollTop = 180;

    await user.click(item);
    expect(await screen.findByText('참여자')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(scrollRoot.scrollTop).toBe(180));
    await waitFor(() => expect(item).toHaveFocus());
  });

  it('동행 요청 전에 최신 상세를 다시 확인하고 요청 성공 후 상세로 돌아간다', async () => {
    const user = userEvent.setup();
    const token = 'mock-access-token';
    let detailRequestCount = 0;
    let joinRequestCount = 0;
    useAuthStore.getState().setAccessToken(token);
    useAuthStore.getState().setVerifiedViewerId(token, 7);
    server.use(
      http.get('*/carpools/51', () => {
        detailRequestCount += 1;
        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 51,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역',
            dest_name: '판교역',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 2,
            capacity: 4,
            is_full: false,
            participants: [],
          },
        });
      }),
      http.post('*/carpools/51/join-requests', async ({ request }) => {
        joinRequestCount += 1;
        expect(await request.json()).toEqual({ content: '함께 이동하고 싶어요.' });
        return HttpResponse.json(
          {
            message: '요청이 등록되었습니다',
            data: { id: 702, carpool_id: 51, status: 'PENDING', created_at: '2030-01-01' },
          },
          { status: 201 },
        );
      }),
    );

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: '카풀 게시글 51' }));
    await user.click(await screen.findByRole('button', { name: '동행 요청하기' }));
    const requestMessage = await screen.findByRole('textbox', { name: '요청 메시지' });
    await user.type(requestMessage, '함께 이동하고 싶어요.');
    await user.click(screen.getByRole('button', { name: '전송하기' }));

    expect(await screen.findByText('동행 요청을 보낸 상태예요.')).toBeInTheDocument();
    expect(detailRequestCount).toBe(2);
    expect(joinRequestCount).toBe(1);
    expect(screen.queryByRole('textbox', { name: '요청 메시지' })).not.toBeInTheDocument();
  });

  it('요청 API 실패 때 입력을 유지하고 POST를 자동으로 재전송하지 않는다', async () => {
    const user = userEvent.setup();
    const token = 'mock-access-token';
    let joinRequestCount = 0;
    useAuthStore.getState().setAccessToken(token);
    useAuthStore.getState().setVerifiedViewerId(token, 7);
    server.use(
      http.get('*/carpools/51', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 51,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역',
            dest_name: '판교역',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 2,
            capacity: 4,
            is_full: false,
            participants: [],
          },
        }),
      ),
      http.post('*/carpools/51/join-requests', () => {
        joinRequestCount += 1;
        return HttpResponse.json(
          { message: '요청을 저장하지 못했어요.', error: { code: 'INTERNAL_SERVER_ERROR' } },
          { status: 500 },
        );
      }),
    );

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: '카풀 게시글 51' }));
    await user.click(await screen.findByRole('button', { name: '동행 요청하기' }));
    const message = await screen.findByRole('textbox', { name: '요청 메시지' });
    await user.type(message, '잠시 뒤 다시 시도할게요.');
    await user.click(screen.getByRole('button', { name: '전송하기' }));

    expect(await screen.findByText('요청을 저장하지 못했어요.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '요청 메시지' })).toHaveValue(
      '잠시 뒤 다시 시도할게요.',
    );
    expect(screen.getByRole('button', { name: '전송하기' })).toBeEnabled();
    expect(joinRequestCount).toBe(1);
  });

  it('요청 메시지를 쓴 뒤 나가기를 취소하면 입력을 유지하고 확정하면 비운다', async () => {
    const user = userEvent.setup();
    const token = 'mock-access-token';
    useAuthStore.getState().setAccessToken(token);
    useAuthStore.getState().setVerifiedViewerId(token, 7);
    server.use(
      http.get('*/carpools/51', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 51,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역',
            dest_name: '판교역',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 2,
            capacity: 4,
            is_full: false,
            participants: [],
          },
        }),
      ),
    );

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: '카풀 게시글 51' }));
    await user.click(await screen.findByRole('button', { name: '동행 요청하기' }));
    const requestMessage = await screen.findByRole('textbox', { name: '요청 메시지' });
    await user.type(requestMessage, '작성 중인 메시지');
    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(
      await screen.findByRole('dialog', { name: '작성 중인 요청을 취소할까요?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '계속 작성' }));
    expect(screen.getByRole('textbox', { name: '요청 메시지' })).toHaveValue('작성 중인 메시지');

    await user.click(screen.getByRole('button', { name: '닫기' }));
    await user.click(await screen.findByRole('button', { name: '나가기' }));
    expect(await screen.findByRole('button', { name: '카풀 게시글 51' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '카풀 게시글 51' }));
    await user.click(await screen.findByRole('button', { name: '동행 요청하기' }));
    expect(await screen.findByRole('textbox', { name: '요청 메시지' })).toHaveValue('');
  });

  it('요청 전송 중에는 닫기·Escape·다른 카풀 선택을 막고 POST를 한 번만 보낸다', async () => {
    const user = userEvent.setup();
    const token = 'mock-access-token';
    let releaseRequest: () => void = () => undefined;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });
    let joinRequestCount = 0;
    useAuthStore.getState().setAccessToken(token);
    useAuthStore.getState().setVerifiedViewerId(token, 7);
    server.use(
      http.get('*/carpools/51', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 51,
            status: 'RECRUITING',
            host: { id: 11, name: '홍길동', profile_image_url: null },
            origin_name: '서울역',
            dest_name: '판교역',
            departure_at: '2030-10-10T09:40:00.000Z',
            car_model: '아반떼',
            current_count: 2,
            capacity: 4,
            is_full: false,
            participants: [],
          },
        }),
      ),
      http.post('*/carpools/51/join-requests', async () => {
        joinRequestCount += 1;
        await requestGate;
        return HttpResponse.json(
          {
            message: '요청이 등록되었습니다',
            data: { id: 702, carpool_id: 51, status: 'PENDING', created_at: '2030-01-01' },
          },
          { status: 201 },
        );
      }),
    );

    renderMatchingPage();
    await user.click(await screen.findByRole('button', { name: '카풀 게시글 51' }));
    await user.click(await screen.findByRole('button', { name: '동행 요청하기' }));
    await user.type(await screen.findByRole('textbox', { name: '요청 메시지' }), '전송 중인 요청');
    await user.click(screen.getByRole('button', { name: '전송하기' }));
    await waitFor(() => expect(joinRequestCount).toBe(1));

    expect(screen.getByRole('button', { name: '전송하기' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('textbox', { name: '요청 메시지' })).toHaveValue('전송 중인 요청');
    expect(
      screen.queryByRole('dialog', { name: '작성 중인 요청을 취소할까요?' }),
    ).not.toBeInTheDocument();
    const nextPin = document.querySelector<HTMLButtonElement>(
      '[data-testid="matching-map"] button:last-child',
    );
    expect(nextPin).not.toBeNull();
    if (nextPin) {
      fireEvent.click(nextPin);
    }
    expect(screen.getByRole('textbox', { name: '요청 메시지' })).toHaveValue('전송 중인 요청');
    releaseRequest();

    expect(await screen.findByText('동행 요청을 보낸 상태예요.')).toBeInTheDocument();
    expect(joinRequestCount).toBe(1);
  });
});
