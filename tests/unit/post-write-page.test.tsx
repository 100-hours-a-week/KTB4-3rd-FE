import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostWritePage } from '@/_pages/post-write';
import { usePostDraftStore } from '@/shared/model/stores/post-draft-store';

const navigation = vi.hoisted(() => ({
  back: vi.fn<() => void>(),
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

afterEach(() => {
  cleanup();
  navigation.back.mockReset();
  navigation.push.mockReset();
  usePostDraftStore.getState().resetDraft();
});

describe('PostWritePage', () => {
  it('accompany 타입이면 동행모집 작성 UI를 보여준다', () => {
    render(<PostWritePage type="accompany" />);

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
    expect(screen.getByRole('combobox', { name: '이동 수단' })).toHaveTextContent(
      '이동수단을 선택해주세요',
    );
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
    render(<PostWritePage type="community" />);

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
});
