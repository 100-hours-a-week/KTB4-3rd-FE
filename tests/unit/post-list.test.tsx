import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PostItem,
  PostList,
  type CompanionPost,
  type CommunityPost,
  type Post,
} from '@/entities/post';

const companionPost: CompanionPost = {
  type: 'COMPANION',
  id: 10,
  title: '판교역 → 강남역',
  author: { nickname: '우림', profile_image_url: null },
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  departure_at: '2026-09-05T08:30:00.000Z',
  is_expired: false,
};

const communityPost: CommunityPost = {
  type: 'COMMUNITY',
  id: 88,
  title: '판교역 근처 카페 추천',
  author: { nickname: '루디', profile_image_url: null },
  distance_m: 540,
  comment_count: 3,
  created_at: '2026-09-03T10:00:00.000Z',
};

afterEach(cleanup);

describe('PostItem', () => {
  it('동행 모집 게시글에 출발 시간과 참여 인원을 표시한다', () => {
    render(<PostItem post={companionPost} />);

    expect(screen.getByText('동행')).toBeInTheDocument();
    expect(screen.getByText('판교역 → 강남역')).toBeInTheDocument();
    expect(screen.getByText('320m · 17:30 출발 · 2/4명 참여 중')).toBeInTheDocument();
  });

  it('커뮤니티 게시글은 커뮤 태그와 댓글 수를 표시한다', () => {
    render(<PostItem post={communityPost} />);

    expect(screen.getByText('커뮤')).toBeInTheDocument();
    expect(screen.getByText('커뮤니티 · 540m · 댓글 3개')).toBeInTheDocument();
  });
});

describe('PostList', () => {
  it('전달받은 순서대로 게시글을 나열하고 클릭한 게시글을 전달한다', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn<(post: Post) => void>();

    render(<PostList items={[companionPost, communityPost]} onItemClick={onItemClick} />);

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getAllByRole('button')[0]).toHaveTextContent('판교역 → 강남역');
    expect(screen.getAllByRole('button')[1]).toHaveTextContent('판교역 근처 카페 추천');

    await user.click(screen.getByRole('button', { name: /판교역 → 강남역/ }));

    expect(onItemClick).toHaveBeenCalledOnce();
    expect(onItemClick).toHaveBeenCalledWith(companionPost);
  });
});
