import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PostTypeSelectionPage } from '@/_pages/post-type-selection';
import type { PostType } from '@/entities/post';
import { usePostCreateStore } from '@/features/post-create';

afterEach(() => {
  cleanup();
  usePostCreateStore.getState().resetDraft();
});

describe('PostTypeSelectionPage', () => {
  it('글 타입과 선택 위치를 디자인 문구로 렌더링한다', () => {
    usePostCreateStore.getState().setPostLocation({ lat: 37.3945, lng: 127.1112 }, '강남역');

    render(<PostTypeSelectionPage backHref="/post/create/location" />);

    expect(screen.getByRole('heading', { name: '어떤 글을 등록할까요?' })).toBeInTheDocument();
    expect(screen.getByText('글의 목적에 맞는 유형을 선택해 주세요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '뒤로가기' })).toHaveAttribute(
      'href',
      '/post/create/location',
    );
    expect(screen.getByRole('button', { name: /동행 모집/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /커뮤니티 글/ })).toBeInTheDocument();
    expect(screen.getByText('선택 위치')).toBeInTheDocument();
    expect(screen.getByText('강남역')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });

  it('커뮤니티 글을 기본 선택하고 다른 글 타입을 선택할 수 있다', async () => {
    const user = userEvent.setup();
    usePostCreateStore.getState().setPostLocation({ lat: 37.3945, lng: 127.1112 }, '판교역');

    render(<PostTypeSelectionPage />);

    const companionOption = screen.getByRole('button', { name: /동행 모집/ });
    const communityOption = screen.getByRole('button', { name: /커뮤니티 글/ });

    expect(communityOption).toHaveAttribute('aria-pressed', 'true');
    expect(companionOption).toHaveAttribute('aria-pressed', 'false');

    await user.click(companionOption);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(companionOption).toHaveAttribute('aria-pressed', 'true');
    expect(communityOption).toHaveAttribute('aria-pressed', 'false');
    expect(usePostCreateStore.getState().type).toBe('COMPANION');
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

  it('작성 데이터가 있으면 타입 변경 전에 확인하고 취소할 수 있다', async () => {
    const user = userEvent.setup();
    const store = usePostCreateStore.getState();

    store.setType('COMMUNITY');
    store.setCommunityField('title', '작성 중인 게시글');

    render(<PostTypeSelectionPage />);

    await user.click(screen.getByRole('button', { name: /동행 모집/ }));

    const dialog = screen.getByRole('dialog', {
      name: '게시글 타입을 바꾸면 작성한 게시글 정보가 사라져요.',
    });

    expect(dialog).toHaveClass('!w-[calc(100%-40px)]', '!max-w-[353px]');
    expect(usePostCreateStore.getState().type).toBe('COMMUNITY');
    expect(usePostCreateStore.getState().community.title).toBe('작성 중인 게시글');

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByText('게시글 타입을 바꾸면 작성한 게시글 정보가 사라져요.')).toBeNull();
    expect(usePostCreateStore.getState().type).toBe('COMMUNITY');
  });

  it('타입 변경을 확인하면 작성 데이터와 세션스토리지 상태를 초기화한다', async () => {
    const user = userEvent.setup();
    const store = usePostCreateStore.getState();

    store.setType('COMMUNITY');
    store.setCommunityField('title', '작성 중인 게시글');

    render(<PostTypeSelectionPage />);

    await user.click(screen.getByRole('button', { name: /동행 모집/ }));
    await user.click(screen.getByRole('button', { name: '바꾸기' }));

    expect(usePostCreateStore.getState().type).toBe('COMPANION');
    expect(usePostCreateStore.getState().community.title).toBe('');
    expect(sessionStorage.getItem('post-create-draft')).not.toContain('작성 중인 게시글');
  });
});
