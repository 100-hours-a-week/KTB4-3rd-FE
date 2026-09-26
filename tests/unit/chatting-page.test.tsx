import userEvent from '@testing-library/user-event';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChattingPage, createChatRoom, generalChatRoom } from '@/_pages/chatting';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  vi.useRealTimers();
});

describe('ChattingPage', () => {
  it('채팅방 ID를 동적으로 반영한 채팅방을 생성한다', () => {
    expect(createChatRoom('501')).toMatchObject({
      id: '501',
      title: generalChatRoom.title,
      memberCount: generalChatRoom.memberCount,
    });
  });

  it('일반 채팅방 헤더와 초기 메시지를 렌더링한다', () => {
    render(<ChattingPage room={generalChatRoom} />);

    expect(screen.getByRole('heading', { name: '5시 판교역' })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveClass('!fixed');
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '채팅방 나가기' })).toHaveAttribute('href', '/');
    expect(screen.getByText('첫번째 유저예요!')).toBeInTheDocument();
    expect(screen.getByText('ㅇㅇ 님이 입장하셨어요')).toBeInTheDocument();
    expect(screen.getByText('어디서 만나실건가요')).toBeInTheDocument();
    expect(screen.getByLabelText('채팅 메시지')).toHaveClass('overflow-y-auto');

    const composer = screen.getByRole('textbox', { name: '메시지 입력' }).closest('form');
    expect(composer).toHaveClass('!fixed');
  });

  it('메시지를 입력하고 전송하면 내 메시지를 추가한다', async () => {
    const user = userEvent.setup();

    render(<ChattingPage room={generalChatRoom} />);

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await user.type(input, '새로운 메시지');
    await user.click(screen.getByRole('button', { name: '메시지 전송' }));

    expect(screen.getByText('새로운 메시지')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('타인의 메시지를 1초 이상 누르면 신고 메뉴를 연다', () => {
    vi.useFakeTimers();
    render(<ChattingPage room={generalChatRoom} />);

    const trigger = screen.getAllByLabelText('메시지 메뉴 열기')[0];
    fireEvent.pointerDown(trigger, { button: 0, pointerId: 1, pointerType: 'touch' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('menu', { name: '메시지 메뉴 열기' })).toBeInTheDocument();

    fireEvent.pointerUp(trigger, { pointerId: 1, pointerType: 'touch' });
  });

  it.each(['채팅 신고하기', '유저 신고하기'])(
    '신고 메뉴의 %s를 누르면 신고 모달을 연다',
    async (item) => {
      const user = userEvent.setup();
      render(<ChattingPage room={generalChatRoom} />);

      await user.click(screen.getAllByLabelText('메시지 메뉴 열기')[0]);
      await user.click(screen.getByRole('menuitem', { name: item }));

      expect(screen.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeInTheDocument();
    },
  );
});
