import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChattingPage, createChatRoom, generalChatRoom } from '@/_pages/chatting';
import { ChatRoomContent } from '@/_pages/chatting/ui/chat-room-content';
import { useAuthStore } from '@/entities/auth';
import { emitMockChatRoomMessage } from '@/shared/api/mocks/chat-room-websocket.handlers';
import type { ChatRoomWebSocketConnectionValue } from '@/features/chatting';
import { server } from '@/shared/api/mocks/server';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  useAuthStore.getState().clearTokens();
  useSnackbarStore.getState().reset();
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
      <ChattingPage roomId={roomId} />
    </QueryClientProvider>,
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

  it('웹소켓 연결 중에도 채팅 입력은 가능하고 전송만 비활성화한다', () => {
    const sendMessage = vi.fn<(content: string) => boolean>(() => false);
    const connection = {
      error: null,
      sendMessage,
      status: 'connecting',
    } satisfies ChatRoomWebSocketConnectionValue;

    render(<ChatRoomContent connection={connection} liveMessages={[]} room={generalChatRoom} />);

    const input = screen.getByRole('textbox', { name: '메시지 입력' });
    const sendButton = screen.getByRole('button', { name: '메시지 전송' });

    expect(input).toBeEnabled();
    expect(sendButton).toBeDisabled();

    fireEvent.change(input, { target: { value: '입장 직후 입력한 메시지' } });

    expect(input).toHaveValue('입장 직후 입력한 메시지');
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('택시팟 상세 API 응답으로 안내 영역을 렌더링한다', async () => {
    renderChattingPage('599');

    expect(await screen.findByRole('heading', { name: '5시 판교역' })).toBeInTheDocument();
    expect(await screen.findByTestId('taxi-pot-announcement')).toBeInTheDocument();
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
    expect(input).toHaveValue('');
  });

  it('방장이 운행 시작을 확인하면 PATCH 성공 후 시작 알림으로 바꾸고 나가기 버튼을 숨긴다', async () => {
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

    expect(await screen.findByText('운행이 시작됐어요')).toBeInTheDocument();
    expect(screen.queryByText('운행이 시작됐나요?')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '채팅방 나가기' })).not.toBeInTheDocument();
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
    expect(screen.getByRole('link', { name: '채팅방 나가기' })).toBeInTheDocument();
  });

  it('비방장이 운행 시작 웹소켓 메시지를 받으면 시작 알림으로 바꾸고 나가기 버튼을 숨긴다', async () => {
    renderChattingPage('599');
    await screen.findByTestId('taxi-pot-announcement');
    await emitTaxiPotMessage('SYSTEM_RIDE_STARTED');

    expect(await screen.findByText('운행이 시작됐어요')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '채팅방 나가기' })).not.toBeInTheDocument();
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
    expect(screen.queryByRole('link', { name: '채팅방 나가기' })).not.toBeInTheDocument();
  });

  it('타인의 메시지를 1초 이상 누르면 신고 메뉴를 연다', async () => {
    renderChattingPage();
    await screen.findByText('3분 뒤 도착합니다');
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
      renderChattingPage();
      await screen.findByText('3분 뒤 도착합니다');

      await user.click(screen.getAllByLabelText('메시지 메뉴 열기')[0]);
      await user.click(screen.getByRole('menuitem', { name: item }));

      expect(screen.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeInTheDocument();
    },
  );
});
