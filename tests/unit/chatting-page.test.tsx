import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChattingPage, createChatRoom, generalChatRoom } from '@/_pages/chatting';
import { useAuthStore } from '@/entities/auth';
import { server } from '@/shared/api/mocks/server';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  useAuthStore.getState().clearTokens();
  vi.useRealTimers();
});

beforeEach(() => {
  useAuthStore.getState().setAccessToken('mock-access-token');
});

function renderChattingPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChattingPage roomId="501" />
    </QueryClientProvider>,
  );
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
    expect(screen.getByText('탑승 시작 요청이 등록되었어요')).toBeInTheDocument();
    expect(screen.getByLabelText('채팅 메시지')).toHaveClass('overflow-y-auto');
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
            kind: 'TAXI_POT',
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
    await user.click(screen.getByRole('button', { name: '메시지 전송' }));

    expect(screen.getByText('새로운 메시지')).toBeInTheDocument();
    expect(input).toHaveValue('');
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
