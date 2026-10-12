import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { NotificationPage } from '@/_pages/notification';

vi.mock('next/navigation', () => ({
  usePathname: () => '/notification',
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const notifications = [
  {
    id: 1,
    type: 'COMMENT_CREATED' as const,
    event_id: 1,
    target_chat_room_id: null,
    target_post_id: 10,
    content: '우림님이 댓글을 남겼어요',
    read_at: null,
    created_at: '2026-09-04T09:00:00',
  },
  {
    id: 2,
    type: 'SETTLEMENT_REQUESTED' as const,
    event_id: 2,
    target_chat_room_id: 11,
    target_post_id: null,
    content: '정산 요청이 도착했어요',
    read_at: '2026-09-04T09:01:00',
    created_at: '2026-09-04T09:00:00',
  },
];

afterEach(cleanup);

describe('NotificationPage', () => {
  it('전체와 안읽음 탭에 맞춰 알림을 필터링한다', async () => {
    const user = userEvent.setup();
    render(<NotificationPage notifications={notifications} />);

    expect(screen.getByRole('heading', { name: '알림' })).toBeInTheDocument();
    expect(screen.getByText(notifications[0].content)).toBeInTheDocument();
    expect(screen.getByText(notifications[1].content)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '안읽음' }));

    expect(screen.getByText(notifications[0].content)).toBeInTheDocument();
    expect(screen.queryByText(notifications[1].content)).not.toBeInTheDocument();
  });

  it('모두 읽기 동작을 호출하고 채팅 내비게이션을 활성화한다', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn<() => void>();
    render(<NotificationPage notifications={notifications} onMarkAllRead={onMarkAllRead} />);

    await user.click(screen.getByRole('button', { name: '모두 읽기' }));

    expect(onMarkAllRead).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: '채팅・요청' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('로딩 시 알림 리스트 대신 다섯 개 스켈레톤을 표시한다', () => {
    render(<NotificationPage isLoading notifications={notifications} />);

    expect(screen.getByRole('list', { name: '알림을 불러오는 중' }).children).toHaveLength(5);
    expect(screen.queryByText(notifications[0].content)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모두 읽기' })).toBeInTheDocument();
  });
});
