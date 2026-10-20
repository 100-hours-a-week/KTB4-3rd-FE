import { http, HttpResponse } from 'msw';

import type { Notification, NotificationType } from '@/shared/api/notifications';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const NOTIFICATION_PAGE_SIZE = 20;

export const MOCK_NOTIFICATION_SCENARIOS = {
  INTERNAL_SERVER_ERROR_NOTIFICATION_ID: 999,
  INTERNAL_SERVER_ERROR_MAX_NOTIFICATION_ID: 998,
} as const;

const notificationTypes: NotificationType[] = [
  'COMMENT_CREATED',
  'CARPOOL_REQUEST_RECEIVED',
  'CARPOOL_REQUEST_ACCEPTED',
  'SETTLEMENT_REQUESTED',
  'MATCHING_COMPLETED',
];

const notificationContents: Record<NotificationType, string> = {
  COMMENT_CREATED: '우림님이 댓글을 남겼어요',
  CARPOOL_REQUEST_RECEIVED: '민준님이 동승을 요청했어요',
  CARPOOL_REQUEST_ACCEPTED: '루디님이 동승 요청을 수락했어요',
  SETTLEMENT_REQUESTED: '정산 요청이 도착했어요',
  MATCHING_COMPLETED: '매칭이 완료됐어요',
};

const MOCK_EVENT_IDS: Record<number, number> = { 900: 12, 899: 31, 898: 27, 897: 7, 881: 40 };

function getMockReadAt(id: number, index: number, createdAt: string) {
  if (id === 881) {
    return '2026-09-03T21:05:00';
  }

  if (index % 3 !== 2) {
    return null;
  }

  return new Date(Date.parse(createdAt) + 5 * 60_000).toISOString().replace(/\.000Z$/, '');
}

const MOCK_NOTIFICATIONS: Notification[] = Array.from({ length: 25 }, (_, index) => {
  const id = 900 - index;
  const type = notificationTypes[index % notificationTypes.length];
  const isComment = type === 'COMMENT_CREATED';
  const targetId = [88, 54, 52, 41, 40][index % notificationTypes.length];
  const createdAt =
    id === 881
      ? '2026-09-03T21:00:00'
      : new Date(Date.UTC(2026, 8, 4, 9, 0) - index * 10 * 60_000)
          .toISOString()
          .replace(/\.000Z$/, '');

  return {
    id,
    type,
    event_id: MOCK_EVENT_IDS[id] ?? 50 + index,
    target_chat_room_id: isComment ? null : targetId,
    target_post_id: isComment ? targetId : null,
    content: notificationContents[type],
    read_at: getMockReadAt(id, index, createdAt),
    created_at: createdAt,
  };
});

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
  );
}

function serverErrorResponse() {
  return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
}

function notFoundResponse() {
  return errorResponse('알림을 찾을 수 없어요', 'NOT_FOUND', null, 404);
}

function currentTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidCursor(cursor: string) {
  const id = Number(cursor);

  return /^\d+$/.test(cursor) && Number.isSafeInteger(id) && id > 0;
}

export const notificationHandlers = [
  http.get('*/notifications', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const params = new URL(request.url).searchParams;
    const tab = params.get('tab');
    const cursor = params.get('cursor');

    if (tab === 'read') {
      return errorResponse('지원하지 않는 탭이에요', 'VALIDATION_ERROR', 'tab', 422);
    }

    if (tab !== null && tab !== 'all' && tab !== 'unread') {
      return errorResponse('탭 값이 올바르지 않아요', 'VALIDATION_ERROR', 'tab', 400);
    }

    if (cursor !== null && !isValidCursor(cursor)) {
      return errorResponse('커서 값이 올바르지 않아요', 'VALIDATION_ERROR', 'cursor', 400);
    }

    const filteredNotifications = MOCK_NOTIFICATIONS.filter((notification) => {
      const matchesTab = tab !== 'unread' || notification.read_at === null;
      const matchesCursor = cursor === null || notification.id < Number(cursor);

      return matchesTab && matchesCursor;
    });
    const notifications = filteredNotifications.slice(0, NOTIFICATION_PAGE_SIZE);
    const hasNextPage = filteredNotifications.length > NOTIFICATION_PAGE_SIZE;
    const lastNotification = notifications.at(-1);

    return HttpResponse.json({
      message: notifications.length === 0 ? '알림 내역이 없어요' : '조회에 성공했습니다',
      data: {
        notifications,
        next_cursor: hasNextPage && lastNotification ? String(lastNotification.id) : null,
      },
    });
  }),
  http.patch('*/notifications/:notificationId/read_at', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const notificationId = Number(params.notificationId);

    if (notificationId === MOCK_NOTIFICATION_SCENARIOS.INTERNAL_SERVER_ERROR_NOTIFICATION_ID) {
      return serverErrorResponse();
    }

    if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
      return notFoundResponse();
    }

    const notification = MOCK_NOTIFICATIONS.find((item) => item.id === notificationId);

    if (!notification) {
      return notFoundResponse();
    }

    notification.read_at ??= currentTimestamp();

    return HttpResponse.json({
      message: '읽음 처리되었습니다',
      data: { read_at: notification.read_at },
    });
  }),
  http.patch('*/notifications/read-all', async ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse('요청 형식이 올바르지 않습니다.', 'MALFORMED_REQUEST', null, 400);
    }

    if (!isObject(body) || !('max_notification_id' in body)) {
      return errorResponse('요청 형식이 올바르지 않습니다.', 'MALFORMED_REQUEST', null, 400);
    }

    const maxNotificationId = body.max_notification_id;

    if (maxNotificationId !== null && typeof maxNotificationId !== 'number') {
      return errorResponse('요청 형식이 올바르지 않습니다.', 'MALFORMED_REQUEST', null, 400);
    }

    if (typeof maxNotificationId === 'number' && !Number.isSafeInteger(maxNotificationId)) {
      return errorResponse('요청 형식이 올바르지 않습니다.', 'MALFORMED_REQUEST', null, 400);
    }

    if (typeof maxNotificationId === 'number' && maxNotificationId <= 0) {
      return errorResponse(
        '알림 id 값이 올바르지 않아요',
        'VALIDATION_ERROR',
        'max_notification_id',
        400,
      );
    }

    if (
      maxNotificationId === MOCK_NOTIFICATION_SCENARIOS.INTERNAL_SERVER_ERROR_MAX_NOTIFICATION_ID
    ) {
      return serverErrorResponse();
    }

    if (maxNotificationId === null) {
      return HttpResponse.json({
        message: '읽음 처리할 알림이 없어요',
        data: null,
      });
    }

    const readAt = currentTimestamp();

    MOCK_NOTIFICATIONS.forEach((notification) => {
      if (notification.id <= maxNotificationId && notification.read_at === null) {
        notification.read_at = readAt;
      }
    });

    return HttpResponse.json({
      message: '모두 읽음 처리되었습니다',
      data: null,
    });
  }),
];
