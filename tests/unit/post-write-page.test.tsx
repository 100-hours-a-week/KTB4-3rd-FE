import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { PostWritePage } from '@/_pages/post-write';
import { usePostCreateStore } from '@/features/post-create';

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
  });
});
