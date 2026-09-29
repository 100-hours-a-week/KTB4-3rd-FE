import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatActionNotice } from '@/features/chatting';

afterEach(cleanup);

describe('ChatActionNotice', () => {
  it('시스템 메시지와 확인 버튼을 렌더링한다', () => {
    render(<ChatActionNotice actionLabel="확인">운행이 시작됐나요?</ChatActionNotice>);

    const notice = screen.getByText('운행이 시작됐나요?').parentElement;
    const button = screen.getByRole('button', { name: '확인' });

    expect(notice).toHaveAttribute('data-component', 'chat-action-notice');
    expect(notice).toHaveClass(
      'w-[240px]',
      'rounded-[12px]',
      'bg-[var(--color-bg-brand-weak)]',
      'p-4',
    );
    expect(button).toHaveClass('h-[44px]', '!rounded-[10px]');
  });

  it('확인 버튼 클릭 이벤트를 전달한다', () => {
    const onClick = vi.fn<() => void>();

    render(
      <ChatActionNotice actionLabel="확인" actionProps={{ onClick }}>
        운행이 시작됐나요?
      </ChatActionNotice>,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('actionProps로 버튼 상태를 전달한다', () => {
    render(
      <ChatActionNotice actionLabel="확인" actionProps={{ disabled: true }}>
        운행이 시작됐나요?
      </ChatActionNotice>,
    );

    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });
});
