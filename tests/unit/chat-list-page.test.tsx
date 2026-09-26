import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatListPageContent,
  ChatListPageContentLoading,
  type ChatListPageStates,
} from '@/_pages/chat-list';

const chatRooms = [
  {
    id: 501,
    companion_id: 10,
    kind: 'TAXI_POT' as const,
    title: '8시 판교역',
    host: { profile_image_url: null },
    current_count: 3,
    capacity: 4,
    has_unread: true,
  },
];

afterEach(cleanup);

describe('ChatListPageContent', () => {
  it('응답 목록이 있으면 채팅방 목록을 표시한다', () => {
    const states: ChatListPageStates = {
      matching: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: chatRooms, next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    expect(screen.getByRole('button', { name: /8시 판교역/ })).toBeInTheDocument();
    expect(screen.queryByTestId('chat-list-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-list-scroll-region')).toBeInTheDocument();
    expect(screen.getByTestId('chat-list-scroll-region')).toHaveClass(
      'flex-1',
      '-mx-5',
      '!w-[calc(100%+2.5rem)]',
      'overflow-hidden',
    );
    expect(screen.getByRole('list').parentElement).toHaveClass(
      'h-full',
      'overflow-x-hidden',
      'overflow-y-auto',
      'overscroll-contain',
      '[scrollbar-width:none]',
      '[-ms-overflow-style:none]',
      '[&::-webkit-scrollbar]:hidden',
    );
  });

  it('목록이 비어 있으면 빈 상태를 표시한다', () => {
    const states: ChatListPageStates = {
      matching: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: [], next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    expect(screen.getByTestId('chat-list-empty')).toBeInTheDocument();
    expect(screen.getByText('참여중인 채팅방이 없어요')).toBeInTheDocument();
  });

  it('오류 응답이면 오류 상태와 재시도 버튼을 표시한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn<(tab: 'matching' | 'community') => void>();
    const states: ChatListPageStates = {
      matching: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'error' },
    };

    render(<ChatListPageContent onRetry={onRetry} states={states} />);
    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    expect(screen.getByTestId('chat-list-error')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledWith('community');
  });

  it('탭을 바꾸면 해당 탭의 상태를 표시한다', async () => {
    const user = userEvent.setup();
    const states: ChatListPageStates = {
      matching: { status: 'success', data: { items: chatRooms, next_cursor: null } },
      community: { status: 'success', data: { items: [], next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);
    await user.click(screen.getByRole('tab', { name: '매칭' }));

    expect(screen.getByRole('button', { name: /8시 판교역/ })).toBeInTheDocument();
    expect(screen.queryByTestId('chat-list-empty')).not.toBeInTheDocument();
  });
});

describe('ChatListPageContentLoading', () => {
  it('채팅 목록 로딩 스켈레톤을 표시한다', () => {
    render(<ChatListPageContentLoading />);

    expect(screen.getByRole('region', { name: '채팅 목록을 불러오는 중' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(6);
  });
});
