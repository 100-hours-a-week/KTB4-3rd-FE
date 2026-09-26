import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatSatisfactionDialog,
  type ChatSatisfactionParticipant,
  type ChatSatisfactionDialogSubmitPayload,
} from '@/features/chatting';

afterEach(cleanup);

describe('ChatSatisfactionDialog', () => {
  it('동승자별 만족도 입력과 신고하기 액션을 렌더링한다', () => {
    render(<ChatSatisfactionDialog defaultOpen />);

    expect(screen.getByRole('dialog', { name: '만족도를 입력해주세요.' })).toBeInTheDocument();
    expect(screen.getByText('동승자에 대한 만족도를 입력해주세요.')).toBeInTheDocument();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: /신고하기$/ })).toHaveLength(3);
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('별점을 변경하고 확인 버튼으로 입력값을 전달한다', () => {
    const onSubmit = vi.fn<(payload: ChatSatisfactionDialogSubmitPayload) => void>();

    render(<ChatSatisfactionDialog defaultOpen onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('radio', { name: '김oo 3점' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onSubmit).toHaveBeenCalledWith({
      ratings: {
        'participant-1': 3,
        'participant-2': 5,
        'participant-3': 5,
      },
    });
    expect(
      screen.queryByRole('dialog', { name: '만족도를 입력해주세요.' }),
    ).not.toBeInTheDocument();
  });

  it('신고하기 클릭 시 해당 동승자를 전달한다', () => {
    const onReport = vi.fn<(participant: ChatSatisfactionParticipant) => void>();

    render(<ChatSatisfactionDialog defaultOpen onReport={onReport} />);

    fireEvent.click(screen.getByRole('button', { name: '김oo 신고하기' }));

    expect(onReport).toHaveBeenCalledWith({ id: 'participant-1', name: '김oo' });
  });
});
