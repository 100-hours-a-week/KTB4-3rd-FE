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

    expect(screen.getByRole('heading', { name: '커뮤니티 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '커뮤니티 게시글 작성' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '제목' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '내용' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '출발지' })).not.toBeInTheDocument();
  });
});
