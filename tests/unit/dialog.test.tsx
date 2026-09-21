import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog } from '@/shared/ui/dialog';

afterEach(cleanup);

describe('Dialog', () => {
  it('title은 필수로 렌더링하고 description과 children은 선택적으로 렌더링한다', () => {
    render(
      <Dialog defaultOpen title="제목" description="설명">
        <p>본문</p>
      </Dialog>,
    );

    expect(screen.getByRole('dialog', { name: '제목' })).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: '제목' });
    const closeButton = screen.getByRole('button', { name: '닫기' });

    expect(heading).toBeInTheDocument();
    expect(screen.getByText('설명')).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(closeButton).toHaveClass('text-[var(--color-fg-neutral-muted)]');
    expect(closeButton.parentElement).toContainElement(heading);
    expect(closeButton.parentElement).toHaveClass('items-start');
  });

  it('primary 버튼만 기본으로 렌더링한다', () => {
    render(<Dialog defaultOpen title="제목" />);

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
  });

  it('primary와 secondary 버튼을 모두 렌더링한다', () => {
    render(<Dialog buttons="primarySecondary" defaultOpen title="제목" />);

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
    expect(screen.getByTestId('dialog-footer')).toHaveClass('flex-row');
  });

  it('noChildren 변형은 본문 없이 footer만 렌더링한다', () => {
    render(<Dialog defaultOpen title="제목" />);

    expect(screen.queryByTestId('dialog-body')).not.toBeInTheDocument();
    expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
  });

  it('children은 footer를 밀어내지 않는 내부 스크롤 영역으로 렌더링한다', () => {
    render(
      <Dialog defaultOpen title="긴 본문">
        <div style={{ height: 1200 }}>긴 본문</div>
      </Dialog>,
    );

    const body = screen.getByTestId('dialog-body');
    const contentRegion = body.parentElement;

    expect(body).toHaveClass('flex-1', 'min-h-0', 'overflow-y-auto', 'pt-8');
    expect(contentRegion).toHaveClass('flex-1', 'min-h-0', 'overflow-hidden');
    expect(screen.getByTestId('dialog-footer')).toHaveClass('shrink-0');
  });

  it('header close button은 dialog를 닫고 onOpenChange를 호출한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(<Dialog defaultOpen onOpenChange={onOpenChange} title="제목" />);

    await user.click(screen.getByRole('button', { name: '닫기' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog', { name: '제목' })).not.toBeInTheDocument();
  });

  it('primary action은 사용자 handler를 호출한 뒤 dialog를 닫는다', () => {
    const onClick = vi.fn<() => void>();

    render(<Dialog defaultOpen primaryButtonProps={{ onClick }} title="제목" />);

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog', { name: '제목' })).not.toBeInTheDocument();
  });

  it('ESC와 backdrop click으로 dialog를 닫을 수 있다', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(<Dialog defaultOpen onOpenChange={onOpenChange} title="제목" />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog', { name: '제목' })).not.toBeInTheDocument();

    render(<Dialog defaultOpen onOpenChange={onOpenChange} title="두 번째 제목" />);
    fireEvent.click(screen.getAllByTestId('dialog-backdrop').at(-1) as HTMLElement);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('closeOnBackdropClick이 false면 backdrop click으로 dialog를 닫지 않는다', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Dialog closeOnBackdropClick={false} defaultOpen onOpenChange={onOpenChange} title="제목" />,
    );

    fireEvent.click(screen.getByTestId('dialog-backdrop'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '제목' })).toBeInTheDocument();
  });

  it('본문을 스크롤하면 header divider와 scroll fog를 표시한다', () => {
    render(
      <Dialog defaultOpen title="긴 본문">
        <div>본문</div>
      </Dialog>,
    );

    const body = screen.getByTestId('dialog-body');

    Object.defineProperties(body, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 80, writable: true },
    });
    fireEvent.scroll(body);

    expect(screen.getByTestId('dialog-header')).toHaveAttribute('data-scrolled', 'true');
    expect(screen.getByTestId('dialog-scroll-fog')).toBeInTheDocument();
  });
});
