import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Snackbar } from '@/shared/ui/snackbar';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Snackbar', () => {
  it('기본 변형은 아이콘과 액션 없이 메시지를 표시한다', () => {
    render(<Snackbar content="저장되었습니다" />);

    const snackbar = screen.getByRole('status');

    expect(snackbar).toHaveTextContent('저장되었습니다');
    expect(snackbar).toHaveClass(
      'h-[var(--dimension-x10)]',
      'w-[340px]',
      'bg-[var(--color-bg-neutral-inverted)]',
      'px-[var(--dimension-x4)]',
    );
    expect(snackbar.querySelector('[role="img"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['positive', 'checkmarkCircle'],
    ['critical', 'exclamationmarkCircleFill'],
  ] as const)('%s 변형은 기본 prefix icon을 표시한다', (variant, iconName) => {
    render(<Snackbar content="메시지를 입력하세요" variant={variant} />);

    const icon = screen.getByRole('status').querySelector('span[aria-hidden="true"]');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveStyle({
      maskImage: `url("/icons/seed/icon_${iconName === 'checkmarkCircle' ? 'checkmark_circle_fill' : 'exclamationmark_circle_fill'}.svg")`,
    });
  });

  it('액션 버튼은 label을 표시하고 actionClick을 호출한다', async () => {
    const user = userEvent.setup();
    const actionClick = vi.fn<() => void>();

    render(
      <Snackbar
        actionButton="확인"
        actionClick={actionClick}
        content="완료되었습니다"
        variant="positive"
      />,
    );

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(actionClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveClass(
      'pl-[var(--dimension-x2)]',
      'pr-[var(--dimension-x2)]',
    );
  });

  it('icon을 null로 전달하면 기본 아이콘을 숨긴다', () => {
    render(<Snackbar content="아이콘 없음" icon={null} variant="critical" />);

    expect(
      screen.getByRole('status').querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });

  it('durationTime이 지나면 자동으로 숨기고 onOpenChange를 호출한다', () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Snackbar content="잠시 후 사라집니다" durationTime={1000} onOpenChange={onOpenChange} />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('open을 false로 전달하면 렌더링하지 않는다', () => {
    render(<Snackbar content="숨겨진 메시지" open={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
