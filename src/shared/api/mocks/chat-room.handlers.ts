import { http, HttpResponse } from 'msw';

import type { ChatRoomListData, ChatRoomKind } from '@/entities/chat';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

const MOCK_CHAT_ROOMS = {
  101: {
    id: 101,
    companion_id: 1,
    kind: 'GENERAL',
    title: '서울역 10번 출구',
    host_id: 7,
    origin_name: '서울역 10번 출구',
    dest_name: '판교역 1번 출구',
    departure_at: '2026-09-22T09:40:00.000Z',
    current_count: 2,
    capacity: 4,
    companion_status: 'IN_PROGRESS',
    closed_at: null,
    last_read_message_id: 1010,
    participants: [{ id: 15, nickname: '타요' }],
  },
  501: {
    id: 501,
    companion_id: 10,
    kind: 'GENERAL',
    title: '8시 판교역',
    host_id: 7,
    origin_name: '판교역',
    dest_name: '강남역',
    departure_at: '2026-09-05T08:30:00.000Z',
    current_count: 3,
    capacity: 4,
    companion_status: 'IN_PROGRESS',
    closed_at: null,
    last_read_message_id: 1440,
    participants: [
      { id: 9, nickname: '루디' },
      { id: 15, nickname: '타요' },
    ],
  },
  599: {
    id: 599,
    companion_id: 30,
    kind: 'TAXI_POT',
    title: '5시 판교역',
    host_id: 7,
    origin_name: '판교역',
    dest_name: '강남역',
    departure_at: '2026-09-05T08:30:00.000Z',
    current_count: 2,
    capacity: 4,
    companion_status: 'RECRUITING',
    closed_at: null,
    last_read_message_id: null,
    participants: [{ id: 9, nickname: '루디' }],
  },
  600: {
    id: 600,
    companion_id: 31,
    kind: 'TAXI_POT',
    title: '9시 서울역',
    host_id: 8,
    origin_name: '서울역',
    dest_name: '강남역',
    departure_at: '2026-09-05T09:00:00.000Z',
    current_count: 3,
    capacity: 4,
    companion_status: 'RECRUITING',
    closed_at: null,
    last_read_message_id: null,
    participants: [
      { id: 9, nickname: '루디' },
      { id: 15, nickname: '타요' },
    ],
  },
} as const;

const MOCK_CHAT_ROOM_LISTS: Record<ChatRoomKind, ChatRoomListData> = {
  TAXI_POT: {
    items: [
      {
        id: 599,
        companion_id: 30,
        kind: 'TAXI_POT',
        title: '5시 판교역',
        host: { profile_image_url: null },
        current_count: 2,
        capacity: 4,
        has_unread: false,
      },
      {
        id: 600,
        companion_id: 31,
        kind: 'TAXI_POT',
        title: '9시 서울역',
        host: { profile_image_url: null },
        current_count: 3,
        capacity: 4,
        has_unread: true,
      },
    ],
    next_cursor: 'taxi-pot-next',
  },
  COMPANION: {
    items: [
      {
        id: 501,
        companion_id: 10,
        kind: 'COMPANION',
        title: '8시 판교역',
        host: { profile_image_url: null },
        current_count: 3,
        capacity: 4,
        has_unread: true,
      },
    ],
    next_cursor: 'companion-next',
  },
  CARPOOL: {
    items: [],
    next_cursor: null,
  },
};

const MOCK_CHAT_ROOM_LIST_NEXT_PAGES: Record<string, ChatRoomListData> = {
  'taxi-pot-next': {
    items: [
      {
        id: 601,
        companion_id: 32,
        kind: 'TAXI_POT',
        title: '7시 선릉역',
        host: { profile_image_url: null },
        current_count: 2,
        capacity: 4,
        has_unread: false,
      },
    ],
    next_cursor: null,
  },
  'companion-next': {
    items: [
      {
        id: 502,
        companion_id: 11,
        kind: 'COMPANION',
        title: '커뮤니티 채팅방 다음 페이지',
        host: { profile_image_url: null },
        current_count: 2,
        capacity: 4,
        has_unread: false,
      },
    ],
    next_cursor: null,
  },
};

const MOCK_CHAT_MESSAGES = {
  101: {
    items: [
      {
        id: 1012,
        type: 'TEXT',
        content: '곧 출발할게요.',
        sender: { id: 7, nickname: '모여타', profile_image_url: null },
        created_at: '2026-09-22T09:35:00.000Z',
      },
      {
        id: 1010,
        type: 'SYSTEM_JOIN',
        content: null,
        joiner: { id: 15, name: '타요' },
        created_at: '2026-09-22T09:30:00.000Z',
      },
    ],
    next_cursor: null,
  },
  501: {
    items: [
      {
        id: 1441,
        type: 'TEXT',
        sender: { id: 7, nickname: '우림', profile_image_url: null },
        content: '3분 뒤 도착합니다',
        created_at: '2026-09-05T07:41:12.000Z',
      },
      {
        id: 1452,
        type: 'SYSTEM_RIDE_START_REQUESTED',
        created_at: '2026-09-05T07:58:12.000Z',
      },
      {
        id: 1453,
        type: 'SYSTEM_RIDE_ENDED',
        created_at: '2026-09-05T08:10:00.000Z',
      },
      {
        id: 1440,
        type: 'SYSTEM_JOIN',
        joiner: { id: 9, name: '루디' },
        created_at: '2026-09-05T07:40:00.000Z',
      },
      {
        id: 1439,
        type: 'SYSTEM_LEAVE',
        leaver: { id: 12, name: '민준' },
        created_at: '2026-09-05T07:35:00.000Z',
      },
    ],
    next_cursor: 'v1.eyJsYXN0X2lkIjoxNDM5fQ',
  },
  599: {
    items: [],
    next_cursor: null,
  },
  600: {
    items: [
      {
        id: 1600,
        type: 'SYSTEM_JOIN',
        joiner: { id: 15, name: '타요' },
        created_at: '2026-09-05T08:00:00.000Z',
      },
    ],
    next_cursor: null,
  },
} as const;

function unauthorizedResponse() {
  return HttpResponse.json(
    {
      message: '로그인이 필요합니다',
      error: { code: 'UNAUTHORIZED', field: null },
    },
    {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    },
  );
}

function getRoom(roomId: string) {
  return MOCK_CHAT_ROOMS[Number(roomId) as keyof typeof MOCK_CHAT_ROOMS];
}

function getMessages(roomId: string) {
  return MOCK_CHAT_MESSAGES[Number(roomId) as keyof typeof MOCK_CHAT_MESSAGES];
}

export const chatRoomHandlers = [
  http.get('*/chat-rooms', ({ request }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const searchParams = new URL(request.url).searchParams;
    const kind = searchParams.get('kind');
    const cursor = searchParams.get('cursor');

    if (kind && !(kind in MOCK_CHAT_ROOM_LISTS)) {
      return errorResponse('조회 조건을 확인해주세요', 'VALIDATION_ERROR', 'kind', 400);
    }

    if (cursor === 'invalid') {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }

    let data: ChatRoomListData | undefined;

    if (cursor) {
      data = MOCK_CHAT_ROOM_LIST_NEXT_PAGES[cursor];
    } else if (kind) {
      data = MOCK_CHAT_ROOM_LISTS[kind as keyof typeof MOCK_CHAT_ROOM_LISTS];
    } else {
      data = {
        items: Object.values(MOCK_CHAT_ROOM_LISTS).flatMap((list) => list.items),
        next_cursor: null,
      };
    }

    if (!data) {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data,
    });
  }),
  http.get('*/chat-rooms/:roomId/messages', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const roomId = String(params.roomId);
    const cursor = new URL(request.url).searchParams.get('cursor');

    if (cursor === 'invalid') {
      return errorResponse('잘못된 커서입니다', 'INVALID_CURSOR', null, 400);
    }

    if (roomId === '999') {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    const messages = getMessages(roomId);

    if (!messages) {
      return errorResponse('존재하지 않는 채팅방입니다', 'CHATROOM_NOT_FOUND', null, 404);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: messages,
    });
  }),
  http.get('*/chat-rooms/:roomId', ({ request, params }) => {
    if (getBearerToken(request) !== MOCK_ACCESS_TOKEN) {
      return unauthorizedResponse();
    }

    const roomId = String(params.roomId);

    if (roomId === '999') {
      return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
    }

    const room = getRoom(roomId);

    if (!room) {
      return errorResponse('존재하지 않는 채팅방입니다', 'CHATROOM_NOT_FOUND', null, 404);
    }

    return HttpResponse.json({
      message: '조회에 성공했습니다',
      data: room,
    });
  }),
];
