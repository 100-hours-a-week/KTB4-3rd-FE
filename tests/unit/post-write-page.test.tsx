import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { PostWritePage } from '@/_pages/post-write';
import { usePostCreateStore } from '@/features/post-create';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');

const navigation = vi.hoisted(() => ({
  back: vi.fn<() => void>(),
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  navigation.back.mockReset();
  navigation.push.mockReset();
  useAuthStore.getState().clearTokens();
  usePostCreateStore.getState().resetDraft();
  useSnackbarStore.getState().reset();
});

function renderPostWritePage(type: 'accompany' | 'community') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PostWritePage type={type} />
    </QueryClientProvider>,
  );
}

function getWheel(column: HTMLElement) {
  const wheel = column.querySelector('[data-rwp]');

  if (!(wheel instanceof HTMLElement)) {
    throw new Error('DatePicker 휠을 찾을 수 없습니다.');
  }

  return wheel;
}

function useImmediateAnimationFrame() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(performance.now() + 1000);
    return 0;
  });
}

describe('PostWritePage', () => {
  it('accompany 타입이면 동행모집 작성 UI를 보여준다', () => {
    renderPostWritePage('accompany');

    expect(screen.getByRole('heading', { name: '동행 모집' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '동행모집 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '출발지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '목적지' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '출발 날짜' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '출발 시간' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '이동 수단' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '모집 인원' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '출발지' })).toHaveTextContent('출발지 검색');
    expect(screen.getByRole('button', { name: '목적지' })).toHaveTextContent('목적지 검색');
    fireEvent.click(screen.getByRole('button', { name: '출발지' }));
    expect(navigation.push).toHaveBeenCalledWith('/posts/write/location?field=departure');
    navigation.push.mockReset();
    fireEvent.click(screen.getByRole('button', { name: '목적지' }));
    expect(navigation.push).toHaveBeenCalledWith('/posts/write/location?field=destination');
    expect(screen.getByRole('button', { name: '출발 날짜' })).toHaveTextContent('날짜 선택');
    expect(screen.getByRole('button', { name: '출발 시간' })).toHaveTextContent('시간 선택');
    expect(screen.getByRole('combobox', { name: '이동 수단' })).toHaveTextContent('택시');
    expect(screen.getByRole('combobox', { name: '모집 인원' })).toHaveTextContent(
      '인원을선택해주세요',
    );
    expect(screen.getByRole('textbox', { name: '모집 내용' })).toHaveAttribute('maxlength', '200');
    expect(screen.getByLabelText('글자 수', { selector: 'span' })).toHaveTextContent('0 / 200');
    expect(screen.queryByText('도움말 텍스트 입력')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '출발 날짜' }));
    expect(screen.getAllByRole('dialog').at(-1)).toHaveClass('max-w-[393px]');
  });

  it('community 타입이면 커뮤니티 작성 UI를 보여준다', () => {
    renderPostWritePage('community');

    expect(screen.getByRole('heading', { name: '커뮤니티' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '커뮤니티 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveAttribute('maxlength', '30');
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveAttribute('maxlength', '280');
    const characterCounts = screen.getAllByLabelText('글자 수', { selector: 'span' });
    expect(characterCounts[0]).toHaveTextContent('0 / 30');
    expect(characterCounts[1]).toHaveTextContent('0 / 280');
    expect(screen.queryByText('도움말 텍스트 입력')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '출발지' })).not.toBeInTheDocument();
  });

  it('동행모집 날짜의 년월 변경을 작성 화면과 클라이언트 상태에 반영한다', async () => {
    useImmediateAnimationFrame();
    usePostCreateStore.getState().setCompanionField('departureDate', '2026-02-09');

    renderPostWritePage('accompany');
    fireEvent.click(screen.getByRole('button', { name: '출발 날짜' }));
    fireEvent.click(screen.getByRole('button', { name: '2026년 2월' }));

    const monthColumn = screen.getByRole('listbox', { name: '월' });
    fireEvent.keyDown(getWheel(monthColumn), { key: 'ArrowDown' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2026년 3월' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(usePostCreateStore.getState().companion.departureDate).toBe('2026-03-09');
    expect(screen.getByRole('button', { name: '출발 날짜' })).toHaveTextContent('2026/03/09');
  });

  it('커뮤니티 등록하기 버튼을 누르면 커뮤니티 게시글 등록 API를 요청한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    usePostCreateStore.getState().setPostLocation({ lat: 37.3945, lng: 127.1112 }, '판교역');
    usePostCreateStore.getState().setCommunityField('title', '판교역 근처 카페 추천');
    usePostCreateStore
      .getState()
      .setCommunityField('content', '조용히 작업하기 좋은 카페가 있을까요?');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderPostWritePage('community');
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        `${apiBaseUrl}/community-posts`,
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(navigation.push).toHaveBeenCalledWith('/');
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '핀 등록이 완료됐어요',
      open: true,
      type: 'positive',
    });
    expect(usePostCreateStore.getState()).toMatchObject({
      type: null,
      postLocation: null,
      postLocationName: null,
      companion: {
        origin: null,
        destination: null,
        departureDate: null,
        departureTime: null,
        recruitCount: null,
        content: '',
      },
      community: { title: '', content: '' },
    });
  });

  it('동행모집 등록하기 버튼을 누르면 동행모집 게시글 등록 API를 요청한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    usePostCreateStore.getState().setCompanionLocation('origin', {
      name: '판교역',
      lat: 37.3945,
      lng: 127.1112,
    });
    usePostCreateStore.getState().setCompanionLocation('destination', {
      name: '강남역',
      lat: 37.4979,
      lng: 127.0276,
    });
    usePostCreateStore.getState().setCompanionField('departureDate', '2026-09-05');
    usePostCreateStore.getState().setCompanionField('departureTime', {
      period: '오전',
      hour: 8,
      minute: 30,
    });
    usePostCreateStore.getState().setCompanionField('recruitCount', 3);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderPostWritePage('accompany');
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        `${apiBaseUrl}/companion-posts`,
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(navigation.push).toHaveBeenCalledWith('/');
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '핀 등록이 완료됐어요',
      open: true,
      type: 'positive',
    });
    expect(usePostCreateStore.getState()).toMatchObject({
      type: null,
      postLocation: null,
      postLocationName: null,
      companion: {
        origin: null,
        destination: null,
        departureDate: null,
        departureTime: null,
        recruitCount: null,
        content: '',
      },
      community: { title: '', content: '' },
    });
  });

  it('동행모집 필수 항목이 누락되면 API 요청 없이 스낵바를 표시한다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderPostWritePage('accompany');
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '출발지, 목적지, 출발 날짜, 출발 시간, 모집 인원을 모두 입력해주세요',
      open: true,
      type: 'critical',
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      '출발지, 목적지, 출발 날짜, 출발 시간, 모집 인원을 모두 입력해주세요',
    );
  });

  it('백엔드 등록 오류 메시지를 스낵바로 표시한다', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    usePostCreateStore.getState().setCompanionLocation('origin', {
      name: '판교역',
      lat: 37.3945,
      lng: 127.1112,
    });
    usePostCreateStore.getState().setCompanionLocation('destination', {
      name: '강남역',
      lat: 37.4979,
      lng: 127.0276,
    });
    usePostCreateStore.getState().setCompanionField('departureDate', '2026-09-05');
    usePostCreateStore.getState().setCompanionField('departureTime', {
      period: '오전',
      hour: 8,
      minute: 30,
    });
    usePostCreateStore.getState().setCompanionField('recruitCount', 3);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: '출발 시간은 현재 시간 이후로 설정해주세요',
          error: { code: 'INVALID_DEPARTURE_TIME', field: 'departure_at' },
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 422 },
      ),
    );

    renderPostWritePage('accompany');
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      '출발 시간은 현재 시간 이후로 설정해주세요',
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      `${apiBaseUrl}/companion-posts`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(useSnackbarStore.getState()).toMatchObject({
      description: '출발 시간은 현재 시간 이후로 설정해주세요',
      open: true,
      type: 'critical',
    });
    expect(navigation.push).not.toHaveBeenCalledWith('/');
  });
});
