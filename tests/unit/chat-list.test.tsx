import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatItem, ChatList, type ChatRoomListItem } from '@/entities/chat';

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
});
