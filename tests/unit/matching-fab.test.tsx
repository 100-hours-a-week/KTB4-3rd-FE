import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MatchingFab } from '@/features/matching-entry';

afterEach(cleanup);

describe('MatchingFab', () => {
  it('닫힌 상태에서는 메인 버튼만 표시하고 열기 요청을 전달한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();

    render(
      <MatchingFab
        isOpened={false}
        onCarpoolClick={vi.fn<() => void>()}
        onOpenChange={onOpenChange}
        onTaxipotClick={vi.fn<() => void>()}
      />,
    );

    const trigger = screen.getByRole('button', { name: '매칭 메뉴 열기' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '택시팟 찾기' })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('열린 상태를 표시하고 controlled prop 변경으로 메뉴를 갱신한다', () => {
    const props = {
      isOpened: false,
      onCarpoolClick: vi.fn<() => void>(),
      onOpenChange: vi.fn<(isOpened: boolean) => void>(),
      onTaxipotClick: vi.fn<() => void>(),
    };
    const { rerender } = render(<MatchingFab {...props} />);

    expect(screen.queryByRole('button', { name: '카풀 등록' })).not.toBeInTheDocument();

    rerender(<MatchingFab {...props} isOpened />);

    const trigger = screen.getByRole('button', { name: '매칭 메뉴 닫기' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: '카풀 등록' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '택시팟 찾기' })).toBeInTheDocument();
  });

  it('열린 상태에서 바깥 영역을 누르면 닫기를 요청한다', () => {
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();

    render(
      <>
        <MatchingFab
          isOpened
          onCarpoolClick={vi.fn<() => void>()}
          onOpenChange={onOpenChange}
          onTaxipotClick={vi.fn<() => void>()}
        />
        <button type="button">다른 영역</button>
      </>,
    );

    fireEvent.pointerDown(screen.getByRole('button', { name: '다른 영역' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('열린 상태에서 Escape를 누르면 닫기를 요청한다', () => {
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();

    render(
      <MatchingFab
        isOpened
        onCarpoolClick={vi.fn<() => void>()}
        onOpenChange={onOpenChange}
        onTaxipotClick={vi.fn<() => void>()}
      />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('열린 상태에서 메인 버튼을 누르면 닫기 요청만 전달한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();
    const onCarpoolClick = vi.fn<() => void>();
    const onTaxipotClick = vi.fn<() => void>();

    render(
      <MatchingFab
        isOpened
        onCarpoolClick={onCarpoolClick}
        onOpenChange={onOpenChange}
        onTaxipotClick={onTaxipotClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: '매칭 메뉴 닫기' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(onCarpoolClick).not.toHaveBeenCalled();
    expect(onTaxipotClick).not.toHaveBeenCalled();
  });

  it.each([
    ['카풀 등록', 'carpool'],
    ['택시팟 찾기', 'taxipot'],
  ] as const)('%s 선택 시 닫기와 해당 callback을 요청한다', async (label, action) => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();
    const onCarpoolClick = vi.fn<() => void>();
    const onTaxipotClick = vi.fn<() => void>();

    render(
      <MatchingFab
        isOpened
        onCarpoolClick={onCarpoolClick}
        onOpenChange={onOpenChange}
        onTaxipotClick={onTaxipotClick}
      />,
    );

    await user.click(screen.getByRole('button', { name: label }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(action === 'carpool' ? onCarpoolClick : onTaxipotClick).toHaveBeenCalledOnce();
    expect(action === 'carpool' ? onTaxipotClick : onCarpoolClick).not.toHaveBeenCalled();
    expect(onOpenChange.mock.invocationCallOrder[0]).toBeLessThan(
      (action === 'carpool' ? onCarpoolClick : onTaxipotClick).mock.invocationCallOrder[0],
    );
    expect(screen.getByRole('button', { name: '택시팟 찾기' })).toBeInTheDocument();
  });

  it('키보드로 메인 버튼을 활성화하고 인스턴스마다 고유한 메뉴 id를 제공한다', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(isOpened: boolean) => void>();

    render(
      <>
        <MatchingFab
          isOpened={false}
          onCarpoolClick={vi.fn<() => void>()}
          onOpenChange={onOpenChange}
          onTaxipotClick={vi.fn<() => void>()}
        />
        <MatchingFab
          isOpened={false}
          onCarpoolClick={vi.fn<() => void>()}
          onOpenChange={vi.fn<(isOpened: boolean) => void>()}
          onTaxipotClick={vi.fn<() => void>()}
        />
      </>,
    );

    const triggers = screen.getAllByRole('button', { name: '매칭 메뉴 열기' });
    const controlledIds = triggers.map((trigger) => trigger.getAttribute('aria-controls'));

    expect(new Set(controlledIds).size).toBe(2);
    expect(controlledIds.every((id) => id && document.getElementById(id))).toBe(true);

    triggers[0].focus();
    await user.keyboard('{Enter}');

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(true);
  });
});
