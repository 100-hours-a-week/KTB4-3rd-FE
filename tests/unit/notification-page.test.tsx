import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { NotificationPage, NotificationPageView } from '@/_pages/notification';
import { useNotificationListQuery } from '@/features/notification-center';

vi.mock('@/features/notification-center', () => ({
  useNotificationListQuery: vi.fn<typeof useNotificationListQuery>(),
}));

const mockUseNotificationListQuery = vi.mocked(useNotificationListQuery);

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

afterEach(() => {
  cleanup();
  mockUseNotificationListQuery.mockReset();
});

function mockNotificationQuery(tab: 'all' | 'unread') {
  const items = tab === 'unread' ? [notifications[0]] : notifications;

  mockUseNotificationListQuery.mockReturnValue({
    data: {
      pages: [
        { data: { notifications: items, next_cursor: null }, message: '', status: 'success' },
      ],
      pageParams: [undefined],
    },
    fetchNextPage: vi.fn<() => void>(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: vi.fn<() => void>(),
  } as unknown as ReturnType<typeof useNotificationListQuery>);
}

describe('NotificationPage', () => {
  it('전체와 안읽음 탭에 맞춰 알림을 필터링한다', async () => {
    const user = userEvent.setup();
    render(<NotificationPageView notifications={notifications} />);

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
    render(<NotificationPageView notifications={notifications} onMarkAllRead={onMarkAllRead} />);

    await user.click(screen.getByRole('button', { name: '모두 읽기' }));

    expect(onMarkAllRead).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: '채팅・요청' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('로딩 시 알림 리스트 대신 다섯 개 스켈레톤을 표시한다', () => {
    render(<NotificationPageView isLoading notifications={notifications} />);

    expect(screen.getByRole('list', { name: '알림을 불러오는 중' }).children).toHaveLength(5);
    expect(screen.queryByText(notifications[0].content)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모두 읽기' })).toBeInTheDocument();
  });

  it('조회 오류 시 오류 안내 ResultSection과 다시 불러오기 동작을 표시한다', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn<() => void>();
    mockUseNotificationListQuery.mockReturnValue({
      data: undefined,
      fetchNextPage: vi.fn<() => void>(),
      hasNextPage: false,
      isError: true,
      isFetchingNextPage: false,
      isLoading: false,
      refetch: onRetry,
    } as unknown as ReturnType<typeof useNotificationListQuery>);
    render(<NotificationPage />);

    expect(screen.getByRole('heading', { name: '알림을 불러올 수 없어요' })).toBeInTheDocument();
    const errorDescription = screen.getByText(/불러오는 중 오류가 발생했어요\./);
    expect(errorDescription).toBeInTheDocument();
    expect(errorDescription.textContent).toBe(
      '불러오는 중 오류가 발생했어요.\n잠시 후 다시 시도해주세요.',
    );
    expect(screen.queryByRole('button', { name: '모두 읽기' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('알림이 없으면 빈 상태 안내를 표시한다', () => {
    render(<NotificationPageView />);

    expect(screen.getByRole('heading', { name: '새로운 알림이 없어요' })).toBeInTheDocument();
    expect(screen.getByText('알림이 오면 알려드릴게요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모두 읽기' })).not.toBeInTheDocument();
  });

  it('안읽음 탭에 표시할 알림이 없으면 빈 상태 안내를 표시한다', async () => {
    const user = userEvent.setup();
    render(<NotificationPageView notifications={[notifications[1]]} />);

    await user.click(screen.getByRole('tab', { name: '안읽음' }));

    expect(screen.getByRole('heading', { name: '새로운 알림이 없어요' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '모두 읽기' })).not.toBeInTheDocument();
  });

  it('화면의 탭을 목록 조회 API의 탭 인자로 전달하고 응답 알림을 렌더링한다', async () => {
    const user = userEvent.setup();
    mockNotificationQuery('all');
    render(<NotificationPage />);

    expect(mockUseNotificationListQuery).toHaveBeenLastCalledWith('all');
    expect(screen.getByText(notifications[1].content)).toBeInTheDocument();

    mockNotificationQuery('unread');
    await user.click(screen.getByRole('tab', { name: '안읽음' }));

    expect(mockUseNotificationListQuery).toHaveBeenLastCalledWith('unread');
    expect(screen.getByText(notifications[0].content)).toBeInTheDocument();
    expect(screen.queryByText(notifications[1].content)).not.toBeInTheDocument();
  });
});
