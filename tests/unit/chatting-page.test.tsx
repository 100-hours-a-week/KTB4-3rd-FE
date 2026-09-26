import userEvent from '@testing-library/user-event';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChattingPage, generalChatRoom } from '@/_pages/chatting';

afterEach(cleanup);

describe('ChattingPage', () => {
  it('일반 채팅방 헤더와 초기 메시지를 렌더링한다', () => {
    render(<ChattingPage room={generalChatRoom} />);

    expect(screen.getByRole('heading', { name: '5시 판교역' })).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '채팅방 나가기' })).toHaveAttribute('href', '/');
    expect(screen.getByText('첫번째 유저예요!')).toBeInTheDocument();
    expect(screen.getByText('ㅇㅇ 님이 입장하셨어요')).toBeInTheDocument();
    expect(screen.getByText('어디서 만나실건가요')).toBeInTheDocument();
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
});
