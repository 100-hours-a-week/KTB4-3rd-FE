import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CarpoolReceivedItem,
  CarpoolRequestItem,
  CarpoolRequestTabs,
  ChatCarpoolTabs,
  type CarpoolReceivedRequest,
  type CarpoolSentRequest,
} from '@/entities/carpool';

afterEach(cleanup);

const request: CarpoolSentRequest = {
  id: 88,
  carpool_id: 51,
  status: 'ACCEPTED',
  chat_room_id: 620,
  counterpart: { id: 7, name: '김우림', profile_image_url: null },
  origin_name: '판교역',
  dest_name: '강남역',
  departure_at: '2026-09-08T08:30:00.000Z',
  content: '같이 가고 싶습니다',
  created_at: '2026-09-06T21:10:00.000Z',
};

describe('카풀 요청 표시 컴포넌트', () => {
  it('상위 탭은 선택값과 disabled를 따르고 중복 선택 callback은 생략한다', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: 'chat' | 'carpool') => void>();
    render(<ChatCarpoolTabs value="chat" onValueChange={onValueChange} />);
    expect(screen.getByRole('tab', { name: '채팅' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: '채팅' }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: '카풀' }));
    expect(onValueChange).toHaveBeenCalledWith('carpool');
  });

  it('상위 탭은 좌우 화살표로 탭에 포커스 이동을 지원한다', () => {
    render(<ChatCarpoolTabs value="chat" onValueChange={() => undefined} />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '채팅' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: '카풀' })).toHaveFocus();
  });

  it('요청 방향 탭은 같은 방향 재선택 callback을 생략한다', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: 'SENT' | 'RECEIVED') => void>();
    render(<CarpoolRequestTabs value="SENT" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: '보낸 요청' }));
    expect(onValueChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('tab', { name: '받은 요청' }));
    expect(onValueChange).toHaveBeenCalledWith('RECEIVED');
  });

  it('수락되고 채팅방이 있는 보낸 요청에만 채팅 callback을 연결한다', async () => {
    const user = userEvent.setup();
    const onChatClick = vi.fn<(chatRoomId: number) => void>();
    const { rerender } = render(
      <ul>
        <CarpoolRequestItem request={request} onChatClick={onChatClick} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '채팅하기' }));
    expect(onChatClick).toHaveBeenCalledWith(620);
    rerender(
      <ul>
        <CarpoolRequestItem
          request={{ ...request, chat_room_id: null }}
          onChatClick={onChatClick}
        />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: '채팅하기' })).not.toBeInTheDocument();
    rerender(
      <ul>
        <CarpoolRequestItem request={{ ...request, status: 'PENDING' }} onChatClick={onChatClick} />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: '채팅하기' })).not.toBeInTheDocument();
  });

  it('받은 요청은 카풀 ID와 요청 ID를 전달한다', async () => {
    const user = userEvent.setup();
    const onRequestClick = vi.fn<(carpoolId: number, requestId: number) => void>();
    const received: CarpoolReceivedRequest = { ...request, status: 'PENDING' };
    render(
      <ul>
        <CarpoolReceivedItem request={received} onRequestClick={onRequestClick} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '요청 확인' }));
    expect(onRequestClick).toHaveBeenCalledWith(51, 88);
  });
});
