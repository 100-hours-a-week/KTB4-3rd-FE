import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatNotificationTime,
  NotificationItem,
  NotificationItemSkeleton,
  NotificationList,
  NotificationListSkeleton,
  type Notification,
} from '@/entities/notification';

const now = new Date('2026-09-04T09:00:30');

const notification: Notification = {
  id: 900,
  type: 'COMMENT_CREATED',
  event_id: 12,
  target_chat_room_id: null,
  target_post_id: 88,
  content: '우림님이 댓글을 남겼어요',
  read_at: null,
  created_at: '2026-09-04T09:00:00',
};

afterEach(cleanup);

describe('NotificationItem', () => {
  it('서버 content를 그대로 보여주고 type별 배지를 표시한다', () => {
    const categories = [
      ['COMMENT_CREATED', '커뮤'],
      ['CARPOOL_REQUEST_RECEIVED', '카풀'],
      ['CARPOOL_REQUEST_ACCEPTED', '카풀'],
      ['SETTLEMENT_REQUESTED', '택시'],
      ['MATCHING_COMPLETED', '택시'],
    ] as const;

    for (const [type, label] of categories) {
      const { unmount } = render(
        <NotificationItem notification={{ ...notification, type }} now={now} />,
      );
      expect(screen.getByText(notification.content)).toBeInTheDocument();
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText('방금 전')).toBeInTheDocument();
      unmount();
    }
  });

  it('read_at으로 읽음 상태를 구분한다', () => {
    const { rerender } = render(<NotificationItem notification={notification} now={now} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-read', 'false');

    rerender(
      <NotificationItem
        notification={{ ...notification, read_at: '2026-09-04T09:00:20' }}
        now={now}
      />,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-read', 'true');
  });
});

describe('NotificationList', () => {
  it('입력 순서대로 나열하고 클릭한 알림을 전달한다', async () => {
    const onItemClick = vi.fn<(item: Notification) => void>();
    const second = {
      ...notification,
      id: 901,
      content: '정산 요청이 도착했어요',
      type: 'SETTLEMENT_REQUESTED' as const,
    };
    render(<NotificationList items={[notification, second]} now={now} onItemClick={onItemClick} />);

    expect(screen.getAllByRole('button')[0]).toHaveTextContent(notification.content);
    expect(screen.getAllByRole('button')[1]).toHaveTextContent(second.content);
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(onItemClick).toHaveBeenCalledWith(second);
  });

  it('알림이 없으면 빈 상태를 표시한다', () => {
    render(<NotificationList items={[]} />);
    expect(screen.getByText('알림이 없습니다.')).toBeInTheDocument();
  });
});

describe('NotificationSkeleton', () => {
  it('아이템의 본문·시간·배지 자리 세 곳을 표시한다', () => {
    const { container } = render(
      <ul>
        <NotificationItemSkeleton />
      </ul>,
    );

    expect(container.querySelectorAll('.skeleton-shimmer')).toHaveLength(3);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('리스트 로딩 시 지정한 개수만큼 스켈레톤 아이템을 표시한다', () => {
    const { rerender } = render(<NotificationListSkeleton />);
    expect(screen.getByRole('list', { name: '알림을 불러오는 중' }).children).toHaveLength(5);

    rerender(<NotificationListSkeleton count={3} />);
    expect(screen.getByRole('list', { name: '알림을 불러오는 중' }).children).toHaveLength(3);
  });
});

describe('formatNotificationTime', () => {
  it('지난 시간에 맞는 한국어 문구를 반환한다', () => {
    expect(formatNotificationTime('2026-09-04T09:00:00', now)).toBe('방금 전');
    expect(formatNotificationTime('2026-09-04T08:58:00', now)).toBe('2분 전');
    expect(formatNotificationTime('2026-09-04T07:00:00', now)).toBe('2시간 전');
    expect(formatNotificationTime('2026-09-02T09:00:00', now)).toBe('2일 전');
  });
});
