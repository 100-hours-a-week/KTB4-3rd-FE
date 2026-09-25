import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Icon } from '@/shared/ui/icon';
import { Menu, type MenuItem } from '@/shared/ui/menu';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
  vi.useRealTimers();
});

const items: MenuItem[] = [
  {
    id: 'report-chat',
    icon: <Icon name="messageSquareWarning" size={24} />,
    content: '채팅 신고하기',
  },
  {
    id: 'report-user',
    icon: <Icon name="userRoundX" size={24} />,
    content: '유저 신고하기',
  },
];

function renderMenu(props: Partial<React.ComponentProps<typeof Menu>> = {}) {
  return render(
    <Menu aria-label="채팅 메뉴" items={items} {...props}>
      <button aria-label="메뉴 열기" type="button">
        메시지
      </button>
    </Menu>,
  );
}

describe('Menu', () => {
  it('클릭한 트리거 아래에 데이터로 전달한 메뉴 아이템을 렌더링한다', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(screen.getByRole('menu')).toHaveClass('w-[186px]', 'rounded-[16px]');
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: '채팅 신고하기' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '유저 신고하기' })).toBeInTheDocument();
  });

  it('아이템 클릭 이벤트를 호출하고 메뉴를 닫는다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<(event: React.MouseEvent<HTMLElement>) => void>();
    renderMenu({ items: [{ ...items[0], onClick }, items[1]] });

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    await user.click(screen.getByRole('menuitem', { name: '채팅 신고하기' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('롱프레스가 끝나기 전에는 열리지 않고 지정 시간 후 메뉴를 연다', () => {
    vi.useFakeTimers();
    renderMenu({ longPressDelay: 500 });

    const trigger = screen.getByRole('button', { name: '메뉴 열기' });
    fireEvent.pointerDown(trigger, { button: 0, pointerId: 1, pointerType: 'touch' });

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.pointerUp(trigger, { pointerId: 1, pointerType: 'touch' });
    fireEvent.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('제어 상태에서는 열림 상태 변경을 콜백으로 전달한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    renderMenu({ open: false, onOpenChange });

    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
