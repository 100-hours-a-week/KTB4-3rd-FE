import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PostWritePage } from '@/_pages/post-write';
import { usePostDraftStore } from '@/shared/model/stores/post-draft-store';

afterEach(() => {
  cleanup();
  usePostDraftStore.getState().resetDraft();
});

describe('PostWritePage', () => {
  it('accompany 타입이면 동행모집 작성 UI를 보여준다', () => {
    render(<PostWritePage type="accompany" />);

    expect(screen.getByRole('heading', { name: '동행모집 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '동행모집 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '출발지' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '도착지' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '교통수단' })).toBeInTheDocument();
  });

  it('community 타입이면 커뮤니티 작성 UI를 보여준다', () => {
    render(<PostWritePage type="community" />);

    expect(screen.getByRole('heading', { name: '커뮤니티' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '커뮤니티 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveAttribute('maxlength', '30');
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveAttribute('maxlength', '500');
    const characterCounts = screen.getAllByLabelText('글자 수', { selector: 'span' });
    expect(characterCounts[0]).toHaveTextContent('0 / 30');
    expect(characterCounts[1]).toHaveTextContent('0 / 500');
    expect(screen.queryByText('도움말 텍스트 입력')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '출발지' })).not.toBeInTheDocument();
  });
});
