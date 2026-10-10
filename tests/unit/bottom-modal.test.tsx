import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BottomModal } from '@/shared/ui/bottom-modal';
import { Dialog } from '@/shared/ui/dialog';

afterEach(cleanup);

describe('BottomModal', () => {
  it('children과 헤더 액션을 렌더링한다', () => {
    render(
      <BottomModal href="/posts/1">
        <p>게시글 상세</p>
      </BottomModal>,
    );

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(screen.getByTestId('bottom-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByText('게시글 상세')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '크게보기' })).toHaveAttribute('href', '/posts/1');

    const dialog = screen.getByRole('dialog', { name: '바텀모달' });
    const header = dialog.querySelector('header');
    expect(dialog).toHaveClass('flex', 'flex-col', 'min-h-0', 'min-w-0');
    expect(header).toHaveClass('flex', 'h-11', 'shrink-0', 'bg-[var(--color-bg-layer-default)]');
    expect(screen.getByTestId('bottom-modal-content')).toHaveClass(
      'min-h-0',
      'min-w-0',
      'flex-1',
      'overflow-x-hidden',
      'overflow-y-auto',
      'overscroll-contain',
    );
  });

  it('bottomOffset만큼 하단에서 띄운다', () => {
    render(
      <BottomModal bottomOffset="72px" href="/posts/1">
        <p>게시글 상세</p>
      </BottomModal>,
    );

    expect(screen.getByRole('dialog', { name: '바텀모달' })).toHaveStyle({ bottom: '72px' });
  });

  it('닫기 버튼을 누르면 모달 내부에서 열림 여부를 관리하면 닫는다', () => {
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onClose={onClose} onOpenChange={onOpenChange}>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('backdrop을 누르면 모달 내부에서 열림 여부를 관리하면 닫는다', () => {
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onClose={onClose} onOpenChange={onOpenChange}>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByTestId('bottom-modal-backdrop'));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('부모가 열림 여부를 관리하는 경우 닫기 이벤트를 부모에 위임한다', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onOpenChange={onOpenChange} open>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
  });

  it('부모가 열림 여부를 관리하는 경우 backdrop 닫기 이벤트를 부모에 위임한다', () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <BottomModal href="/posts/1" onOpenChange={onOpenChange} open>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    fireEvent.click(screen.getByTestId('bottom-modal-backdrop'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
  });
  it.each([
    { href: undefined, showExpand: undefined, name: '주소가 없으면' },
    { href: '/posts/1', showExpand: false, name: '확장 버튼을 숨기면' },
  ])('$name 크게보기 링크를 렌더링하지 않는다', ({ href, showExpand }) => {
    render(
      <BottomModal href={href} showExpand={showExpand}>
        <p>게시글 상세</p>
      </BottomModal>,
    );

    expect(screen.queryByRole('link', { name: '크게보기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('닫기 잠금은 버튼·배경·Escape 요청을 막고 잠금을 풀면 닫을 수 있다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const sheet = (closeDisabled: boolean) => (
      <BottomModal closeDisabled={closeDisabled} onClose={onClose} onOpenChange={onOpenChange}>
        <p>게시글 상세</p>
      </BottomModal>
    );
    const { rerender } = render(sheet(true));

    const close = screen.getByRole('button', { name: '닫기' });
    expect(close).toBeDisabled();
    await user.click(close);
    await user.click(screen.getByTestId('bottom-modal-backdrop'));
    await user.keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();

    rerender(sheet(false));
    expect(screen.getByRole('button', { name: '닫기' })).toBeEnabled();
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
    expect(onOpenChange.mock.calls).toEqual([[false]]);
    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
  });

  it('닫기 잠금 중 배경을 눌러도 입력 초점이 모달 내부에 남는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <BottomModal closeDisabled onClose={onClose} onOpenChange={onOpenChange}>
        <input aria-label="신청 내용" />
      </BottomModal>,
    );
    const modal = screen.getByRole('dialog', { name: '바텀모달' });
    const input = screen.getByRole('textbox', { name: '신청 내용' });
    await user.click(input);
    expect(input).toHaveFocus();

    await user.click(screen.getByTestId('bottom-modal-backdrop'));

    await waitFor(() => expect(modal).toContainElement(document.activeElement as HTMLElement));
    expect(onClose).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('열릴 때 모달 자체에 초점을 두고 Tab과 Shift+Tab은 내부에서 순환한다', async () => {
    const user = userEvent.setup();
    render(
      <BottomModal href="/posts/1">
        <input aria-label="신청 내용" />
        <button type="button">신청하기</button>
      </BottomModal>,
    );

    const modal = screen.getByRole('dialog', { name: '바텀모달' });
    const close = screen.getByRole('button', { name: '닫기' });
    const expand = screen.getByRole('link', { name: '크게보기' });
    const input = screen.getByRole('textbox', { name: '신청 내용' });
    const submit = screen.getByRole('button', { name: '신청하기' });
    await waitFor(() => expect(modal).toHaveFocus());

    for (const target of [close, expand, input, submit, close]) {
      await user.tab();
      await waitFor(() => expect(target).toHaveFocus());
    }
    await user.tab({ shift: true });
    await waitFor(() => expect(submit).toHaveFocus());
    for (const target of [input, expand, close, submit]) {
      await user.tab({ shift: true });
      await waitFor(() => expect(target).toHaveFocus());
    }
  });

  it('닫힌 뒤 아직 화면에 있는 열기 버튼으로 초점을 복구한다', async () => {
    const user = userEvent.setup();
    function Preview() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            상세 열기
          </button>
          <BottomModal open={open} onOpenChange={setOpen}>
            <p>게시글 상세</p>
          </BottomModal>
        </>
      );
    }
    render(<Preview />);

    const opener = screen.getByRole('button', { name: '상세 열기' });
    await user.click(opener);
    await waitFor(() => expect(screen.getByRole('dialog', { name: '바텀모달' })).toHaveFocus());
    await user.click(screen.getByRole('button', { name: '닫기' }));

    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
  });

  it('finalFocus로 지정한 대체 버튼으로 닫힌 뒤 초점을 옮긴다', async () => {
    const user = userEvent.setup();
    function Preview() {
      const [open, setOpen] = useState(false);
      const fallbackRef = useRef<HTMLButtonElement | null>(null);
      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            상세 열기
          </button>
          <button ref={fallbackRef} type="button">
            목록으로 이동
          </button>
          <BottomModal finalFocus={fallbackRef} open={open} onOpenChange={setOpen}>
            <p>게시글 상세</p>
          </BottomModal>
        </>
      );
    }
    render(<Preview />);

    await user.click(screen.getByRole('button', { name: '상세 열기' }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: '바텀모달' })).toHaveFocus());
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: '목록으로 이동' })).toHaveFocus(),
    );
    expect(screen.getByRole('button', { name: '상세 열기' })).not.toHaveFocus();
  });

  it('finalFocus가 false면 닫힌 뒤 열기 버튼으로 초점을 복구하지 않는다', async () => {
    const user = userEvent.setup();
    function Preview() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)} type="button">
            상세 열기
          </button>
          <BottomModal finalFocus={false} open={open} onOpenChange={setOpen}>
            <p>게시글 상세</p>
          </BottomModal>
        </>
      );
    }
    render(<Preview />);
    const opener = screen.getByRole('button', { name: '상세 열기' });

    await user.click(opener);
    await waitFor(() => expect(screen.getByRole('dialog', { name: '바텀모달' })).toHaveFocus());
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument(),
    );
    expect(opener).not.toHaveFocus();
  });

  it('중첩 확인 창에서 Escape는 최상위만 닫고 입력을 보존하며 다음 Escape는 바텀모달을 닫는다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn<() => void>();
    render(
      <BottomModal onClose={onClose}>
        <input aria-label="신청 내용" />
        <Dialog title="신청 확인" trigger={<button type="button">확인 창 열기</button>}>
          <p>신청하시겠어요?</p>
        </Dialog>
      </BottomModal>,
    );
    const input = screen.getByRole('textbox', { name: '신청 내용' });
    await user.type(input, '오늘 같이 가요');
    await user.click(screen.getByRole('button', { name: '확인 창 열기' }));
    expect(screen.getByRole('dialog', { name: '신청 확인' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: '신청 확인' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();
    expect(input).toHaveValue('오늘 같이 가요');
    expect(onClose).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('닫기 잠금 중에도 부모가 open을 false로 바꾸면 종료하며 닫기 요청 콜백은 만들지 않는다', () => {
    const onClose = vi.fn<() => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const sheet = (open: boolean) => (
      <BottomModal closeDisabled open={open} onClose={onClose} onOpenChange={onOpenChange}>
        <p>게시글 상세</p>
      </BottomModal>
    );
    const { rerender } = render(sheet(true));
    expect(screen.getByRole('dialog', { name: '바텀모달' })).toBeInTheDocument();

    rerender(sheet(false));

    expect(screen.queryByRole('dialog', { name: '바텀모달' })).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
