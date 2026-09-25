import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CompanionPostDetail,
  CommunityPostDetail,
  type CompanionPostDetailProps,
  type CommunityPostDetailProps,
} from '@/_pages/post-detail';

const companionPost: CompanionPostDetailProps['post'] = {
  type: 'COMPANION',
  id: 10,
  title: '택시 같이 타실 분 구해요!',
  description: '판교역 → 유스페이스까지 차 같이 타실 분을 찾아요.',
  author: { nickname: '우림', profile_image_url: null },
  transport_type: 'TAXI',
  distance_m: 320,
  current_count: 2,
  capacity: 4,
  departure_at: '2026-08-24T09:40:00.000Z',
  departure_location: '판교역 2번 출구',
  destination: '유스페이스 앞',
  is_expired: false,
  participants: [{ id: 1, nickname: 'CAN', profile_image_url: null }],
};

const communityPost: CommunityPostDetailProps['post'] = {
  type: 'COMMUNITY',
  id: 88,
  title: '9007번 버스 줄 개김 ㅋㅋ',
  description: '한 20명 있는듯??',
  author: { nickname: '애롱롱', profile_image_url: null },
  distance_m: 540,
  comment_count: 1,
  created_at: '2026-09-03T10:00:00.000Z',
  comments: [
    {
      id: 1,
      author: { nickname: '유저1', profile_image_url: null },
      content: '와 레전드사건 ㅋㅋ',
    },
  ],
};

afterEach(cleanup);

describe('CompanionPostDetail', () => {
  it('게시글 정보, 이동 상세정보, 참여자와 채팅 참여 버튼을 조합한다', async () => {
    const user = userEvent.setup();
    const onJoinClick = vi.fn<() => void>();

    render(<CompanionPostDetail onJoinClick={onJoinClick} post={companionPost} />);

    expect(screen.getByText('동행 모집')).toBeInTheDocument();
    expect(screen.getByText('택시')).toBeInTheDocument();
    expect(screen.getByText('출발 시간')).toBeInTheDocument();
    expect(screen.getByText('2026/08/24 18:40 (오후)')).toBeInTheDocument();
    expect(screen.getByText('판교역 2번 출구')).toBeInTheDocument();
    expect(screen.getByText('유스페이스 앞')).toBeInTheDocument();
    expect(screen.getByText('2 / 4명')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '채팅 참여하기' }));

    expect(onJoinClick).toHaveBeenCalledOnce();
  });
});

describe('CommunityPostDetail', () => {
  it('게시글 정보, 작성자, 댓글 요약과 댓글 목록을 조합한다', () => {
    render(<CommunityPostDetail post={communityPost} />);

    expect(screen.getByText('커뮤니티')).toBeInTheDocument();
    expect(screen.getByText('애롱롱')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('와 레전드사건 ㅋㅋ')).toBeInTheDocument();

    const metadata = screen.getByText('애롱롱').parentElement;
    const metadataText = metadata?.textContent ?? '';
    expect(metadataText.indexOf('1')).toBeLessThan(metadataText.indexOf('애롱롱'));
    expect(
      screen.getByRole('article').querySelector('svg.lucide-message-square'),
    ).toBeInTheDocument();
  });

  it('댓글 입력값을 전송하고 입력창을 비운다', async () => {
    const user = userEvent.setup();
    const onCommentSubmit = vi.fn<(content: string) => void>();

    render(<CommunityPostDetail onCommentSubmit={onCommentSubmit} post={communityPost} />);

    const input = screen.getByRole('textbox', { name: '댓글 입력' });
    const submitButton = screen.getByRole('button', { name: '댓글 전송' });

    expect(input).toHaveClass(
      '!text-[length:var(--font-size-t4)]',
      '!leading-[var(--line-height-t4)]',
      '!font-[var(--font-weight-regular)]',
    );
    expect(submitButton).toHaveClass('size-[30px]');
    expect(submitButton).toBeDisabled();

    await user.type(input, '새 댓글입니다');
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(onCommentSubmit).toHaveBeenCalledWith('새 댓글입니다');
    expect(input).toHaveValue('');
  });
});
