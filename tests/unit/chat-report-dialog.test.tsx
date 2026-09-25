import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatReportDialog, type ChatReportDialogSubmitPayload } from '@/features/chatting';

afterEach(cleanup);

describe('ChatReportDialog', () => {
  it('공통 Radio로 신고 사유와 기타 입력 영역을 렌더링한다', () => {
    render(<ChatReportDialog defaultOpen />);

    expect(screen.getByRole('dialog', { name: '신고 사유를 선택해주세요' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '비방, 욕설' })).toHaveAttribute('data-checked', '');
    expect(screen.getByRole('radio', { name: '미정산' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '노쇼' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '기타' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '신고 내용' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '신고하기' })).toBeInTheDocument();
  });

  it('기타 사유를 선택했을 때만 입력할 수 있고 제출 콜백으로 전달한다', () => {
    const onSubmit = vi.fn<(payload: ChatReportDialogSubmitPayload) => void>();

    render(<ChatReportDialog defaultOpen onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox', { name: '신고 내용' });

    fireEvent.click(screen.getByRole('radio', { name: '기타' }));
    expect(textarea).toBeEnabled();
    fireEvent.change(textarea, {
      target: { value: '약속 장소에 나타나지 않았습니다.' },
    });
    fireEvent.click(screen.getByRole('radio', { name: '노쇼' }));
    expect(textarea).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: '기타' }));
    fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

    expect(onSubmit).toHaveBeenCalledWith({
      description: '약속 장소에 나타나지 않았습니다.',
      reason: 'other',
    });
    expect(
      screen.queryByRole('dialog', { name: '신고 사유를 선택해주세요' }),
    ).not.toBeInTheDocument();
  });
});
