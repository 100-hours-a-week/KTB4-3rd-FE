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
    render(<Snackbar description="저장되었습니다" timeout={0} />);

    const snackbar = screen.getByRole('status');

    expect(snackbar).toHaveTextContent('저장되었습니다');
    expect(snackbar).toHaveClass(
      'h-[var(--dimension-x10)]',
      'w-[340px]',
      'bg-[var(--color-bg-neutral-inverted)]',
      'px-[calc(var(--dimension-x4)_+_2px)]',
    );
    expect(snackbar.querySelector('[role="img"]')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['positive', 'checkmarkCircle'],
    ['critical', 'exclamationmarkCircleFill'],
  ] as const)('%s 변형은 기본 prefix icon을 표시한다', (variant, iconName) => {
    render(<Snackbar description="메시지를 입력하세요" timeout={0} type={variant} />);

    const icon = screen.getByRole('status').querySelector('span[aria-hidden="true"]');

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveStyle({
      maskImage: `url("/icons/seed/icon_${iconName === 'checkmarkCircle' ? 'checkmark_circle_fill' : 'exclamationmark_circle_fill'}.svg")`,
    });
  });

  it('actionProps.children을 표시하고 actionProps.onClick을 호출한다', async () => {
    const user = userEvent.setup();
    const actionClick = vi.fn<() => void>();

    render(
      <Snackbar
        actionProps={{ children: '확인', onClick: actionClick }}
        description="완료되었습니다"
        timeout={0}
        type="positive"
      />,
    );

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(actionClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveClass(
      'pl-[calc(var(--dimension-x2)_+_2px)]',
      'pr-[calc(var(--dimension-x2)_+_2px)]',
    );
  });

  it('icon을 null로 전달하면 기본 아이콘을 숨긴다', () => {
    render(<Snackbar description="아이콘 없음" icon={null} timeout={0} type="critical" />);

    expect(
      screen.getByRole('status').querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });

  it('timeout이 지나면 자동으로 숨기고 onOpenChange를 호출한다', () => {
    vi.useFakeTimers();
    const onOpenChange = vi.fn<(open: boolean) => void>();

    render(
      <Snackbar description="잠시 후 사라집니다" onOpenChange={onOpenChange} timeout={1000} />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    const snackbar = screen.getByRole('status');

    expect(snackbar).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);

    act(() => vi.advanceTimersByTime(179));

    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('controlled open이 false가 되면 exit animation 후 숨긴다', () => {
    vi.useFakeTimers();
    const { rerender } = render(<Snackbar description="닫히는 메시지" open timeout={0} />);

    rerender(<Snackbar description="닫히는 메시지" open={false} timeout={0} />);

    const snackbar = screen.getByRole('status');

    expect(snackbar).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(179));

    expect(snackbar).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('open을 false로 전달하면 렌더링하지 않는다', () => {
    render(<Snackbar description="숨겨진 메시지" open={false} timeout={0} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
