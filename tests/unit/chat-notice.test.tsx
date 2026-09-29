import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChatNotice } from '@/features/chatting';

afterEach(cleanup);

describe('ChatNotice', () => {
  it.each([
    ['system', 'bg-[var(--color-bg-neutral-weak)]', 'text-[var(--color-fg-neutral-muted)]'],
    ['informative', 'bg-[var(--color-bg-informative-weak)]', 'text-[var(--color-fg-informative)]'],
  ] as const)('variant별 스타일과 메시지를 렌더링한다', (variant, backgroundClass, textClass) => {
    render(<ChatNotice variant={variant}>상태 메시지</ChatNotice>);

    const notice = screen.getByText('상태 메시지');

    expect(notice).toHaveAttribute('data-variant', variant);
    expect(notice).toHaveClass(
      backgroundClass,
      textClass,
      'inline-flex',
      'rounded-full',
      'px-3',
      'py-1',
    );
  });

  it('children으로 사용자 입퇴장과 운행 상태 메시지를 표현한다', () => {
    render(
      <>
        <ChatNotice>ㅇㅇ 님이 입장하셨어요</ChatNotice>
        <ChatNotice variant="informative">운행이 종료됐어요</ChatNotice>
      </>,
    );

    expect(screen.getByText('ㅇㅇ 님이 입장하셨어요')).toBeInTheDocument();
    expect(screen.getByText('운행이 종료됐어요')).toBeInTheDocument();
  });
});
