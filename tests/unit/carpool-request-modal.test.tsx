import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CarpoolRequestModal } from '@/features/carpool-request-review';

const request = {
  id: 41,
  carpool_id: 12,
  status: 'PENDING' as const,
  requester: { id: 8, name: '김모여', profile_image_url: null },
  content: '같이 이동하고 싶어요.',
  created_at: '2026-09-06T21:10:00.000Z',
};

afterEach(cleanup);

describe('CarpoolRequestModal', () => {
  it('renders request details and forwards accept and reject actions', () => {
    const onAccept = vi.fn<() => void>();
    const onReject = vi.fn<() => void>();

    render(
      <CarpoolRequestModal
        canAccept
        canReject
        onAccept={onAccept}
        onClose={vi.fn<() => void>()}
        onReject={onReject}
        open
        processingAction={null}
        request={request}
        status="content"
      />,
    );

    expect(screen.getByText('김모여')).toBeInTheDocument();
    expect(screen.getByText('같이 이동하고 싶어요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '거절' }));
    fireEvent.click(screen.getByRole('button', { name: '수락' }));
    expect(onReject).toHaveBeenCalledOnce();
    expect(onAccept).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: '카풀 요청 확인' })).toBeInTheDocument();
  });

  it('disables only the accept action when accepting is unavailable', () => {
    render(
      <CarpoolRequestModal
        canAccept={false}
        canReject
        onAccept={vi.fn<() => void>()}
        onClose={vi.fn<() => void>()}
        onReject={vi.fn<() => void>()}
        open
        processingAction={null}
        request={request}
        status="content"
      />,
    );

    expect(screen.getByRole('button', { name: '수락' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '거절' })).toBeEnabled();
  });

  it('disables only the reject action when rejecting is unavailable', () => {
    render(
      <CarpoolRequestModal
        canAccept
        canReject={false}
        onAccept={vi.fn<() => void>()}
        onClose={vi.fn<() => void>()}
        onReject={vi.fn<() => void>()}
        open
        processingAction={null}
        request={request}
        status="content"
      />,
    );

    expect(screen.getByRole('button', { name: '거절' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '수락' })).toBeEnabled();
  });

  it('keeps the dialog open and disables actions while a decision is processing', () => {
    const onClose = vi.fn<() => void>();

    render(
      <CarpoolRequestModal
        canAccept
        canReject
        onAccept={vi.fn<() => void>()}
        onClose={onClose}
        onReject={vi.fn<() => void>()}
        open
        processingAction="accept"
        request={request}
        status="content"
      />,
    );

    expect(screen.getByRole('button', { name: '거절' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '수락' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes through the header button while idle', () => {
    const onClose = vi.fn<() => void>();

    render(
      <CarpoolRequestModal
        canAccept
        canReject
        onAccept={vi.fn<() => void>()}
        onClose={onClose}
        onReject={vi.fn<() => void>()}
        open
        processingAction={null}
        request={request}
        status="content"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('blocks backdrop, Escape, and close-button dismissal while a decision is processing', () => {
    const onClose = vi.fn<() => void>();

    render(
      <CarpoolRequestModal
        canAccept
        canReject
        onAccept={vi.fn<() => void>()}
        onClose={onClose}
        onReject={vi.fn<() => void>()}
        open
        processingAction="reject"
        request={request}
        status="content"
      />,
    );

    fireEvent.click(screen.getByTestId('dialog-backdrop'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '카풀 요청 확인' })).toBeInTheDocument();
  });

  it('shows retry for detail errors and hides when closed', () => {
    const onRetry = vi.fn<() => void>();
    const { rerender } = render(
      <CarpoolRequestModal
        errorMessage="요청을 찾을 수 없어요."
        onClose={vi.fn<() => void>()}
        onRetry={onRetry}
        open
        status="error"
      />,
    );

    expect(screen.getByText('요청을 찾을 수 없어요.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<CarpoolRequestModal open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
