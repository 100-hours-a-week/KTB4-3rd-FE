import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatListPageLoading,
  ChatListPageContent,
  ChatListPageContentLoading,
  parseChatListRouteState,
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

describe('ChatList route state', () => {
  it('카풀 받은 요청 딥링크를 카풀 탭과 받은 요청 탭으로 해석한다', () => {
    expect(parseChatListRouteState({ tab: 'carpool', direction: 'RECEIVED' })).toEqual({
      chatTab: 'carpool',
      requestDirection: 'RECEIVED',
    });
  });

  it('알 수 없는 쿼리는 기본 채팅 탭과 보낸 요청 탭으로 처리한다', () => {
    expect(parseChatListRouteState({ tab: 'unknown', direction: ['UNKNOWN', 'RECEIVED'] })).toEqual(
      { chatTab: 'chat', requestDirection: 'SENT' },
    );
  });
});

describe('ChatListPageContent', () => {
  it('응답 목록이 있으면 채팅방 목록을 표시한다', () => {
    const states: ChatListPageStates = {
      taxiPot: { status: 'success', data: { items: [], next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: chatRooms, next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    expect(screen.getByRole('button', { name: /8시 판교역/ })).toBeInTheDocument();
    expect(screen.queryByTestId('chat-list-empty')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-list-scroll-region')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: '채팅 목록 필터' })).toHaveClass('mt-6');
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

  it('스크롤 위치와 콘텐츠 높이에 따라 스크롤 포그를 표시한다', async () => {
    const states: ChatListPageStates = {
      taxiPot: { status: 'success', data: { items: [], next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: chatRooms, next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    const scrollArea = screen.getByRole('list').parentElement;
    if (!scrollArea) {
      throw new Error('채팅 목록 스크롤 영역을 찾을 수 없습니다.');
    }

    let scrollTop = 0;
    Object.defineProperties(scrollArea, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, get: () => scrollTop },
    });

    fireEvent.scroll(scrollArea);
    await waitFor(() => {
      expect(screen.queryByTestId('scroll-fog-top')).not.toBeInTheDocument();
      expect(screen.getByTestId('scroll-fog-bottom')).toBeInTheDocument();
    });

    scrollTop = 100;
    fireEvent.scroll(scrollArea);
    await waitFor(() => {
      expect(screen.getByTestId('scroll-fog-top')).toBeInTheDocument();
      expect(screen.getByTestId('scroll-fog-bottom')).toBeInTheDocument();
    });

    scrollTop = 200;
    fireEvent.scroll(scrollArea);
    await waitFor(() => {
      expect(screen.getByTestId('scroll-fog-top')).toBeInTheDocument();
      expect(screen.queryByTestId('scroll-fog-bottom')).not.toBeInTheDocument();
    });

    Object.defineProperty(scrollArea, 'scrollHeight', { configurable: true, value: 100 });
    fireEvent.scroll(scrollArea);
    await waitFor(() => {
      expect(screen.queryByTestId('scroll-fog-top')).not.toBeInTheDocument();
      expect(screen.queryByTestId('scroll-fog-bottom')).not.toBeInTheDocument();
    });
  });

  it('목록이 비어 있으면 빈 상태를 표시한다', () => {
    const states: ChatListPageStates = {
      taxiPot: { status: 'success', data: { items: [], next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: [], next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    expect(screen.getByTestId('chat-list-empty')).toBeInTheDocument();
    expect(screen.getByText('참여중인 채팅방이 없어요')).toBeInTheDocument();
  });

  it('택시팟 탭이 비어 있으면 택시팟 빈 상태 문구를 표시한다', async () => {
    const user = userEvent.setup();
    const states: ChatListPageStates = {
      taxiPot: { status: 'success', data: { items: [], next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: [], next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);

    await user.click(screen.getByRole('tab', { name: '택시팟' }));

    expect(screen.getByText('참여중인 택시팟이 없어요')).toBeInTheDocument();
    expect(screen.getByText('함께 택시 탈 사람을 찾아보세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '택시팟 찾으러가기' })).toBeInTheDocument();
  });

  it('오류 응답이면 오류 상태와 재시도 버튼을 표시한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn<(tab: 'taxiPot' | 'carpool' | 'community') => void>();
    const states: ChatListPageStates = {
      taxiPot: { status: 'success', data: { items: [], next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
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
      taxiPot: { status: 'success', data: { items: chatRooms, next_cursor: null } },
      carpool: { status: 'success', data: { items: [], next_cursor: null } },
      community: { status: 'success', data: { items: [], next_cursor: null } },
    };

    render(<ChatListPageContent states={states} />);
    await user.click(screen.getByRole('tab', { name: '택시팟' }));

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

  it('페이지 로딩 상태에서도 채팅/카풀 탭을 헤더 바로 아래에 붙여 표시한다', () => {
    render(<ChatListPageLoading />);

    const header = screen.getByRole('banner').parentElement;
    const main = screen.getByRole('main');
    const tabs = screen.getByRole('tablist', { name: '채팅 화면' });

    expect(header?.nextElementSibling).toBe(main);
    expect(main).not.toHaveClass('!pt-8');
    expect(tabs.closest('section')).toBe(main.firstElementChild);
    expect(screen.queryByRole('heading', { name: '채팅' })).not.toBeInTheDocument();
  });
});
