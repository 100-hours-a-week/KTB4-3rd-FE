import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostTypeSelectionPage } from '@/_pages/post-type-selection';
import type { PostType } from '@/entities/post';
import { usePostDraftStore } from '@/shared/model/stores/post-draft-store';

afterEach(() => {
  cleanup();
  usePostDraftStore.getState().resetDraft();
});

describe('PostTypeSelectionPage', () => {
  it('글 타입과 선택 위치를 디자인 문구로 렌더링한다', () => {
    render(<PostTypeSelectionPage />);

    expect(screen.getByRole('heading', { name: '어떤 글을 등록할까요?' })).toBeInTheDocument();
    expect(screen.getByText('글의 목적에 맞는 유형을 선택해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /동행 모집/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /커뮤니티 글/ })).toBeInTheDocument();
    expect(screen.getByText('선택 위치')).toBeInTheDocument();
    expect(screen.getByText('판교역')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });

  it('커뮤니티 글을 기본 선택하고 다른 글 타입을 선택할 수 있다', async () => {
    const user = userEvent.setup();
    render(<PostTypeSelectionPage />);

    const companionOption = screen.getByRole('button', { name: /동행 모집/ });
    const communityOption = screen.getByRole('button', { name: /커뮤니티 글/ });

    expect(communityOption).toHaveAttribute('aria-pressed', 'true');
    expect(companionOption).toHaveAttribute('aria-pressed', 'false');

    await user.click(companionOption);

    expect(companionOption).toHaveAttribute('aria-pressed', 'true');
    expect(communityOption).toHaveAttribute('aria-pressed', 'false');
    expect(usePostDraftStore.getState().type).toBe('COMPANION');
  });

  it('다음 버튼을 누르면 선택한 글 타입을 전달한다', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn<(type: PostType) => void>();
    render(<PostTypeSelectionPage onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: /동행 모집/ }));
    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(onNext).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledWith('COMPANION');
  });
});
