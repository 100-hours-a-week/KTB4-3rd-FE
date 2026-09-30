import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChattingPage, createChatRoom, generalChatRoom } from '@/_pages/chatting';
import { ChatRoomContent } from '@/_pages/chatting/ui/chat-room-content';
import { ChatMessageItem } from '@/_pages/chatting/ui/chat-message-item';
import { SnackbarProvider } from '@/_app/providers';
import { useAuthStore } from '@/entities/auth';
import { emitMockChatRoomMessage } from '@/shared/api/mocks/chat-room-websocket.handlers';
import type { ChatRoomWebSocketConnectionValue } from '@/features/chatting';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const navigation = vi.hoisted(() => ({
  push: vi.fn<(path: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: navigation.push }),
}));

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
  navigation.push.mockReset();
  vi.useRealTimers();
});

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

function renderChattingPage(roomId = '501') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <ChattingPage roomId={roomId} />
      </SnackbarProvider>
    </QueryClientProvider>,
  );
}

function mockCurrentUserId(id: number) {
  server.use(
    http.get('*/users/me', () =>
      HttpResponse.json({
        message: '내 정보 조회에 성공했습니다',
        data: {
          id,
          nickname: '테스트 유저',
          profile_image_url: null,
          has_bank_account: false,
        },
      }),
    ),
  );
}

async function emitTaxiPotMessage(
  type: 'SYSTEM_RIDE_START_REQUESTED' | 'SYSTEM_RIDE_STARTED' | 'SYSTEM_RIDE_END_REQUESTED',
) {
  await new Promise((resolve) => setTimeout(resolve, 30));
  emitMockChatRoomMessage('599', {
    id: Date.now(),
    type,
    created_at: new Date().toISOString(),
  });
}

describe('ChattingPage', () => {
  it('상대방 메시지 좌측에 프로필 아바타를 표시하고 이미지 오류 시 기본 아바타로 전환한다', () => {
    const message = {
      id: 'message-with-avatar',
      kind: 'bubble' as const,
      content: '안녕하세요',
      senderNickname: '루디',
      senderProfileImageUrl: 'https://cdn.moyeota.app/profile/rudy.jpg',
      variant: 'other' as const,
    };

    const { rerender } = render(
      <ChatMessageItem index={0} message={message} onReport={() => {}} />,
    );
    const avatar = screen.getByRole('img', { name: '루디 프로필' });
    const bubble = screen.getByText('안녕하세요').closest<HTMLElement>('[data-variant]');
    const messageRow = avatar.parentElement?.parentElement;

    expect(messageRow?.firstElementChild).toBe(avatar.parentElement);
    expect(messageRow).toContainElement(bubble);

    expect(avatar).toHaveAttribute(
      'src',
      expect.stringContaining('https://cdn.moyeota.app/profile/rudy.jpg'),
    );

    fireEvent.error(avatar);

    expect(avatar).toHaveAttribute('src', expect.stringContaining('/avatars/avatar-default.svg'));

    rerender(
      <ChatMessageItem
        index={0}
        message={{ ...message, senderProfileImageUrl: null }}
        onReport={() => {}}
      />,
    );

    expect(screen.getByRole('img', { name: '루디 프로필' })).toHaveAttribute(
      'src',
      expect.stringContaining('/avatars/avatar-default.svg'),
    );
  });

  it('채팅방 ID를 동적으로 반영한 목업 채팅방을 생성한다', () => {
    expect(createChatRoom('501')).toMatchObject({
      id: '501',
      title: generalChatRoom.title,
      memberCount: generalChatRoom.memberCount,
    });
  });

  it('채팅방 상세와 메시지 목록 API 응답을 UI에 반영한다', async () => {
    renderChattingPage();

    expect(await screen.findByRole('heading', { name: '8시 판교역' })).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('3분 뒤 도착합니다')).toBeInTheDocument();
    expect(screen.getByText('3분 뒤 도착합니다').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'me',
    );
    expect(screen.getByText('루디 님이 입장하셨어요')).toBeInTheDocument();
    expect(screen.getByText('민준 님이 퇴장하셨어요')).toBeInTheDocument();
    expect(screen.getByText('운행이 시작됐나요?')).toBeInTheDocument();
    expect(screen.getByText('운행이 종료됐어요')).toBeInTheDocument();
    expect(screen.getByLabelText('채팅 메시지')).toHaveClass('overflow-y-auto');
    expect(screen.getByRole('textbox', { name: '메시지 입력' }).closest('form')).toHaveClass(
      '!h-[calc(78px+env(safe-area-inset-bottom,0px))]',
      '!pb-[env(safe-area-inset-bottom,0px)]',
    );
  });

  it('기존 운행 시작 요청 메시지를 방장용 시스템 액션으로 표시한다', async () => {
    server.use(
      http.get('*/chat-rooms/599/messages', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: 1452,
                type: 'SYSTEM_RIDE_START_REQUESTED',
                created_at: '2026-09-05T07:58:12.000Z',
              },
            ],
            next_cursor: null,
          },
        }),
      ),
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'RECRUITING',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 2,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
    );

    renderChattingPage('599');

    expect(await screen.findByTestId('taxi-pot-ride-action')).toHaveTextContent(
      '운행이 시작됐나요?',
    );
    expect(screen.queryByText('운행이 시작됐나요?')?.closest('[data-variant]')).toBeNull();
  });

  it('웹소켓 연결 중에도 채팅 입력은 가능하고 전송만 비활성화한다', () => {
    const sendMessage = vi.fn<(content: string) => boolean>(() => false);
    const connection = {
      error: null,
      sendMessage,
      status: 'connecting',
    } satisfies ChatRoomWebSocketConnectionValue;

    render(
      <ChatRoomContent
        connection={connection}
        liveMessages={[]}
        room={{ ...generalChatRoom, memberCount: 2 }}
      />,
    );

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });

    expect(input).toBeEnabled();
    expect(sendButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '입장 직후 입력한 메시지' } });

    expect(input).toHaveValue('입장 직후 입력한 메시지');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('채팅방 인원이 한 명이면 메시지 입력 영역을 비활성화한다', () => {
    const connection = {
      error: null,
      sendMessage: vi.fn<(content: string) => boolean>(() => true),
      status: 'open',
    } satisfies ChatRoomWebSocketConnectionValue;

    render(<ChatRoomContent connection={connection} liveMessages={[]} room={generalChatRoom} />);

    expect(screen.getByRole('textbox', { name: '메시지 입력' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '메시지 전송' })).toBeDisabled();
  });

  it('새로운 메시지가 추가되면 메시지 목록을 하단으로 스크롤한다', () => {
    const connection = {
      error: null,
      sendMessage: vi.fn<(content: string) => boolean>(() => true),
      status: 'open',
    } satisfies ChatRoomWebSocketConnectionValue;
    const { rerender } = render(
      <ChatRoomContent connection={connection} liveMessages={[]} room={generalChatRoom} />,
    );
    const messageList = screen.getByLabelText('채팅 메시지');
    const scrollTo = vi.fn<(options: ScrollToOptions) => void>();

    Object.defineProperty(messageList, 'scrollHeight', {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(messageList, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    rerender(
      <ChatRoomContent
        connection={connection}
        liveMessages={[
          {
            id: 'live-message',
            kind: 'bubble',
            content: '새로운 메시지',
            variant: 'other',
          },
        ]}
        room={generalChatRoom}
      />,
    );

    expect(scrollTo).toHaveBeenCalledWith({ behavior: 'smooth', top: 640 });
  });

  it('메시지 목록 상단에 도달하면 이전 메시지를 조회한다', async () => {
    renderChattingPage();
    await screen.findByRole('heading', { name: '8시 판교역' });

    const messageList = screen.getByLabelText('채팅 메시지');
    Object.defineProperty(messageList, 'scrollTop', {
      configurable: true,
      value: 0,
      writable: true,
    });

    fireEvent.scroll(messageList);

    expect(await screen.findByText('조금 늦을 것 같아요.')).toBeInTheDocument();
  });

  it('택시팟 상세 API 응답으로 안내 영역을 렌더링한다', async () => {
    renderChattingPage('599');

    expect(await screen.findByRole('heading', { name: '5시 판교역' })).toBeInTheDocument();
    expect(await screen.findByTestId('taxi-pot-announcement')).toBeInTheDocument();
  });

  it('나가기 버튼을 누르면 확인 후 DELETE 요청을 보내고 홈으로 이동한다', async () => {
    const user = userEvent.setup();

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');

    await user.click(screen.getByRole('button', { name: '채팅방 나가기' }));

    expect(screen.getByRole('dialog', { name: '채팅방을 나갈까요?' })).toBeInTheDocument();
    expect(screen.getByText('한번 나가면 다시 들어올 수 없어요')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog', { name: '채팅방을 나갈까요?' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '채팅방 나가기' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'));
    expect(screen.getByRole('status')).toHaveTextContent('채팅방을 나갔어요');
  });

  it('일반 동행모집에서 나갈 때 DELETE 요청만 보낸다', async () => {
    const user = userEvent.setup();
    const requests: string[] = [];

    server.use(
      http.delete('*/companion-posts/10/participants/me', () => {
        requests.push('leave');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderChattingPage('501');
    await screen.findByRole('heading', { name: '8시 판교역' });

    await user.click(screen.getByRole('button', { name: '채팅방 나가기' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'));
    expect(requests).toEqual(['leave']);
  });

  it('뒤로가기 버튼을 누르면 마지막 메시지를 읽음 처리한 뒤 채팅방을 나간다', async () => {
    const user = userEvent.setup();
    const requests: string[] = [];

    navigation.push.mockImplementation((path) => {
      requests.push('navigate');
      expect(path).toBe('/');
    });

    server.use(
      http.put('*/chat-rooms/501/read-marker', async ({ request }) => {
        requests.push('read-marker');
        expect(await request.json()).toEqual({ last_read_message_id: '1453' });

        return HttpResponse.json({
          message: '읽음 처리되었습니다',
          data: { last_read_message_id: 1453, has_unread: false },
        });
      }),
    );

    renderChattingPage('501');
    await screen.findByRole('heading', { name: '8시 판교역' });

    await user.click(screen.getByRole('link', { name: '뒤로가기' }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith('/'));
    expect(requests).toEqual(['read-marker', 'navigate']);
  });

  it('방장이면 택시팟 입장 안내 메시지를 순서대로 렌더링한다', async () => {
    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'RECRUITING',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
    );

    renderChattingPage('599');

    expect(await screen.findByText('이번 매칭의 방장이 됐어요!')).toBeInTheDocument();
    expect(screen.getByText(/방장 결제 후 정산/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('같이 갈 사람을 찾는 중이에요');
  });

  it('방장이 아닌 택시팟의 입장 시스템 메시지를 렌더링한다', async () => {
    renderChattingPage('600');

    expect(await screen.findByRole('heading', { name: '9시 서울역' })).toBeInTheDocument();
    expect(screen.getByText('타요 님이 입장하셨어요')).toBeInTheDocument();
  });

  it('채팅방 상세와 메시지 목록 API를 병렬로 요청한다', async () => {
    const startedRequests: string[] = [];
    let resolveDetail: (() => void) | undefined;
    let resolveMessages: (() => void) | undefined;

    server.use(
      http.get('*/chat-rooms/501', async () => {
        startedRequests.push('detail');
        await new Promise<void>((resolve) => {
          resolveDetail = resolve;
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
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
          },
        });
      }),
      http.get('*/chat-rooms/501/messages', async () => {
        startedRequests.push('messages');
        await new Promise<void>((resolve) => {
          resolveMessages = resolve;
        });

        return HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            items: [
              {
                id: 1440,
                type: 'SYSTEM_JOIN',
                content: null,
                joiner: { id: 9, name: '루디' },
                created_at: '2026-09-05T07:40:00.000Z',
              },
            ],
            next_cursor: null,
          },
        });
      }),
    );

    renderChattingPage();

    await waitFor(() => {
      expect(startedRequests).toHaveLength(2);
      expect(new Set(startedRequests)).toEqual(new Set(['detail', 'messages']));
    });

    resolveDetail?.();
    resolveMessages?.();

    expect(await screen.findByRole('heading', { name: '8시 판교역' })).toBeInTheDocument();
  });

  it('메시지를 입력하고 전송하면 내 메시지를 추가한다', async () => {
    const user = userEvent.setup();

    renderChattingPage();
    await screen.findByText('3분 뒤 도착합니다');

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    await user.type(input, '새로운 메시지');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '메시지 전송' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: '메시지 전송' }));

    expect(await screen.findByText('새로운 메시지')).toBeInTheDocument();
    expect(screen.getByText('새로운 메시지').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'me',
    );
    expect(input).toHaveValue('');
  });

  it('택시팟 웹소켓 TEXT 메시지의 sender.name을 표시한다', async () => {
    mockCurrentUserId(1);
    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await new Promise((resolve) => setTimeout(resolve, 30));

    emitMockChatRoomMessage('599', {
      id: 1501,
      type: 'TEXT',
      sender: { id: 9, name: '김동균', profile_image_url: null },
      content: '아하',
      created_at: '2026-09-29T23:31:25.384056368',
    });

    expect(await screen.findByText('김동균')).toBeInTheDocument();
    expect(screen.getByText('아하').closest('[data-variant]')).toHaveAttribute(
      'data-variant',
      'other',
    );
  });

  it('방장이 운행 시작을 확인하면 PATCH 성공 후 액션을 숨기고 나가기 버튼을 숨긴다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'RECRUITING',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.patch('*/taxi-pots/30', async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'IN_PROGRESS' });

        return HttpResponse.json({
          message: '운행 상태가 변경됐어요',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'IN_PROGRESS',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 4,
            capacity: 4,
            host_id: 7,
          },
        });
      }),
    );

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_START_REQUESTED');

    expect(await screen.findByText('운행이 시작됐나요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.queryByTestId('taxi-pot-ride-action')).not.toBeInTheDocument();
    expect(screen.queryByText('운행이 시작됐어요')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '채팅방 나가기' })).not.toBeInTheDocument();
  });

  it('운행 상태 변경 PATCH가 실패하면 액션을 유지하고 오류 Snackbar를 표시한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'RECRUITING',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.patch('*/taxi-pots/30', () =>
        HttpResponse.json(
          {
            message: '서버 오류가 발생했습니다',
            error: { code: 'INTERNAL_SERVER_ERROR', field: null },
          },
          { status: 500 },
        ),
      ),
    );

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_START_REQUESTED');

    expect(await screen.findByText('운행이 시작됐나요?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(
      (await screen.findAllByRole('status')).find((element) =>
        element.textContent?.includes('요청 중 오류가 발생했어요'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('운행이 시작됐나요?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '채팅방 나가기' })).toBeInTheDocument();
  });

  it('비방장이 운행 시작 웹소켓 메시지를 받으면 시작 알림으로 바꾸고 나가기 버튼을 숨긴다', async () => {
    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_STARTED');

    expect(await screen.findByText('운행이 시작됐어요')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '채팅방 나가기' })).not.toBeInTheDocument();
  });

  it('방장이 운행 종료를 확인하면 평가 모달을 열고 백드롭으로 닫히지 않는다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'IN_PROGRESS',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.patch('*/taxi-pots/30', async ({ request }) => {
        expect(await request.json()).toEqual({ status: 'COMPLETED' });

        return HttpResponse.json({
          message: '운행 상태가 변경됐어요',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'COMPLETED',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 4,
            capacity: 4,
            host_id: 7,
          },
        });
      }),
    );

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_END_REQUESTED');

    expect(await screen.findByTestId('taxi-pot-ride-action')).toHaveTextContent(
      '운행이 종료됐나요?',
    );
    await user.click(screen.getByRole('button', { name: '확인' }));

    const dialog = await screen.findByRole('dialog', { name: '만족도를 입력해주세요.' });
    fireEvent.click(screen.getByTestId('dialog-backdrop'));

    expect(dialog).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '채팅방 나가기' })).not.toBeInTheDocument();
  });

  it('평가 모달 확인 버튼을 누르면 동승자 평가를 제출한다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'IN_PROGRESS',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.patch('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '운행 상태가 변경됐어요',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'COMPLETED',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 4,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.post('*/companions/30/ratings', async ({ request }) => {
        expect(await request.json()).toEqual({
          ratings: [{ target_user_id: 9, score: 3 }],
        });

        return HttpResponse.json({ message: '평가가 제출되었습니다', data: null }, { status: 201 });
      }),
    );

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_END_REQUESTED');

    await user.click(await screen.findByRole('button', { name: '확인' }));
    await user.click(screen.getByRole('radio', { name: '루디 3점' }));
    await user.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '만족도를 입력해주세요.' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('평가 모달에서 유저를 신고하면 참여 중인 동행 ID를 신고 API에 보낸다', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '조회에 성공했습니다',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'IN_PROGRESS',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 1,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.patch('*/taxi-pots/30', () =>
        HttpResponse.json({
          message: '운행 상태가 변경됐어요',
          data: {
            id: 30,
            chat_room_id: 599,
            status: 'COMPLETED',
            origin_name: '판교역',
            dest_name: '강남역',
            departure_at: '2026-09-05T08:30:00.000Z',
            current_count: 4,
            capacity: 4,
            host_id: 7,
          },
        }),
      ),
      http.post('*/reports', async ({ request }) => {
        expect(await request.json()).toEqual({
          companion_id: 30,
          reason: 'NO_SHOW',
          reason_text: null,
          reported_user_id: 9,
        });

        return HttpResponse.json(
          {
            message: '신고가 접수되었습니다',
            data: { id: 4, created_at: '2026-09-06T09:00:00' },
          },
          { status: 201 },
        );
      }),
    );

    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_END_REQUESTED');

    await user.click(await screen.findByRole('button', { name: '확인' }));
    await user.click(screen.getByRole('button', { name: '루디 신고하기' }));
    await user.click(screen.getByRole('radio', { name: '노쇼' }));
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '신고 사유를 선택해주세요' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('타인의 메시지를 1초 이상 누르면 신고 메뉴를 연다', async () => {
    mockCurrentUserId(1);
    renderChattingPage();
    await screen.findByText('3분 뒤 도착합니다');
    expect(screen.getByText('우림')).toBeInTheDocument();
    vi.useFakeTimers();

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
      mockCurrentUserId(1);
      renderChattingPage();
      await screen.findByText('3분 뒤 도착합니다');

      await user.click(screen.getAllByLabelText('메시지 메뉴 열기')[0]);
      await user.click(screen.getByRole('menuitem', { name: item }));

      expect(screen.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeInTheDocument();
    },
  );

  it('메시지 텍스트를 누르면 복사 메뉴를 열고 content를 클립보드에 복사한다', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    mockCurrentUserId(7);
    renderChattingPage();

    await screen.findByText('3분 뒤 도착합니다');
    await waitFor(() =>
      expect(screen.getByText('3분 뒤 도착합니다').closest('[data-variant]')).toHaveAttribute(
        'data-variant',
        'me',
      ),
    );

    await user.click(screen.getByLabelText('메시지 메뉴 열기'));
    await user.click(screen.getByRole('menuitem', { name: '복사하기' }));

    expect(writeText).toHaveBeenCalledWith('3분 뒤 도착합니다');
  });

  it('신고하기 버튼을 누르면 신고 API 요청을 보낸다', async () => {
    const user = userEvent.setup();
    mockCurrentUserId(1);

    server.use(
      http.post('*/reports', async ({ request }) => {
        expect(await request.json()).toEqual({
          reason: 'ABUSE',
          reason_text: null,
          reported_message_id: 1441,
          reported_user_id: 7,
        });

        return HttpResponse.json(
          {
            message: '신고가 접수되었습니다',
            data: { id: 4, created_at: '2026-09-06T09:00:00' },
          },
          { status: 201 },
        );
      }),
    );

    renderChattingPage();
    await screen.findByText('3분 뒤 도착합니다');

    await user.click(screen.getAllByLabelText('메시지 메뉴 열기')[0]);
    await user.click(screen.getByRole('menuitem', { name: '채팅 신고하기' }));
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '신고 사유를 선택해주세요' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('유저 신고하기를 누르면 참여 중인 동행 ID를 신고 API에 보낸다', async () => {
    const user = userEvent.setup();
    mockCurrentUserId(1);

    server.use(
      http.post('*/reports', async ({ request }) => {
        expect(await request.json()).toEqual({
          companion_id: 10,
          reason: 'NO_SHOW',
          reason_text: null,
          reported_user_id: 7,
        });

        return HttpResponse.json(
          {
            message: '신고가 접수되었습니다',
            data: { id: 4, created_at: '2026-09-06T09:00:00' },
          },
          { status: 201 },
        );
      }),
    );

    renderChattingPage();
    await screen.findByText('3분 뒤 도착합니다');

    await user.click(screen.getAllByLabelText('메시지 메뉴 열기')[0]);
    await user.click(screen.getByRole('menuitem', { name: '유저 신고하기' }));
    await user.click(screen.getByRole('radio', { name: '노쇼' }));
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '신고 사유를 선택해주세요' }),
      ).not.toBeInTheDocument(),
    );
  });
});
