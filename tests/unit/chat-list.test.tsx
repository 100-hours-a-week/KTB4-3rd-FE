import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatItem,
  ChatList,
  ChatListTabs,
  type ChatListTabValue,
  type ChatRoomListItem,
} from '@/entities/chat';

const chatRoom: ChatRoomListItem = {
  id: 501,
  companion_id: 10,
  kind: 'TAXI_POT',
  title: '8시 판교역',
  host: { profile_image_url: null },
  current_count: 3,
  capacity: 4,
  has_unread: true,
};

const secondChatRoom: ChatRoomListItem = {
  ...chatRoom,
  id: 502,
  title: '판교역 → 유스페이스',
  current_count: 4,
  host: { profile_image_url: '/avatars/avatar-default.svg' },
  has_unread: false,
};

afterEach(cleanup);

describe('ChatItem', () => {
  it('채팅방 이름, 참여자 수, 방장 프로필 이미지를 표시한다', () => {
    render(<ChatItem chatRoom={chatRoom} />);

    expect(screen.getByText('8시 판교역')).toBeInTheDocument();
    expect(screen.getByText('3명 참여')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '방장 프로필 이미지' })).toHaveAttribute(
      'src',
      '/avatars/chat-avatar-placeholder.svg',
    );
  });

  it('방장 프로필 이미지가 있으면 전달받은 이미지를 표시한다', () => {
    render(<ChatItem chatRoom={secondChatRoom} />);

    expect(screen.getByRole('img', { name: '방장 프로필 이미지' })).toHaveAttribute(
      'src',
      '/avatars/avatar-default.svg',
    );
  });
});

describe('ChatList', () => {
  it('전달받은 순서대로 채팅방을 나열하고 클릭한 채팅방을 전달한다', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn<(chatRoom: ChatRoomListItem) => void>();

    render(<ChatList items={[chatRoom, secondChatRoom]} onItemClick={onItemClick} />);

    const items = screen.getAllByRole('button');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('8시 판교역');
    expect(items[1]).toHaveTextContent('판교역 → 유스페이스');

    await user.click(items[1]);

    expect(onItemClick).toHaveBeenCalledOnce();
    expect(onItemClick).toHaveBeenCalledWith(secondChatRoom);
  });

  it('전체 폭 모드에서 목록과 항목의 호버 영역을 확장한다', () => {
    render(<ChatList fullWidth items={[chatRoom]} />);

    expect(screen.getByRole('list', { name: '채팅방 목록' })).toHaveClass(
      '-mx-5',
      '!w-[calc(100%+2.5rem)]',
    );
    expect(screen.getByRole('button', { name: /8시 판교역/ })).toHaveClass('px-5');
    expect(
      screen
        .getByRole('button', { name: /8시 판교역/ })
        .parentElement?.querySelector('[aria-hidden="true"]'),
    ).toHaveClass('left-5', '!w-[calc(100%-2.5rem)]');
  });
});

describe('ChatListTabs', () => {
  it('커뮤니티 탭을 기본 선택 상태로 보여준다', () => {
    render(<ChatListTabs />);

    expect(screen.getByRole('tab', { name: '매칭' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: '커뮤니티' })).toHaveAttribute('aria-selected', 'true');
  });

  it('탭을 클릭하면 선택 상태와 변경 이벤트를 전달한다', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: ChatListTabValue) => void>();

    render(<ChatListTabs onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: '매칭' }));

    expect(screen.getByRole('tab', { name: '매칭' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '커뮤니티' })).toHaveAttribute('aria-selected', 'false');
    expect(onValueChange).toHaveBeenCalledWith('matching');
  });
});
