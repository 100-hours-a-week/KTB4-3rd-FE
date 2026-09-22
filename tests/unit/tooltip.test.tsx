import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from '@/shared/ui/tooltip';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderTooltip(props: Partial<React.ComponentProps<typeof Tooltip>> = {}) {
  return render(
    <Tooltip message="탑승인원은 본인 제외예요." {...props}>
      <button type="button">안내</button>
    </Tooltip>,
  );
}

describe('Tooltip', () => {
  it('shows on mount and fades out after three seconds', () => {
    vi.useFakeTimers();
    renderTooltip();

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveAttribute('data-state', 'open');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(tooltip).toHaveAttribute('data-state', 'closing');
    expect(tooltip).toHaveClass('opacity-0');

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows after a long press and fades after release', () => {
    vi.useFakeTimers();
    renderTooltip({ initialDisplayDuration: 0, releaseDisplayDuration: 3000 });

    const button = screen.getByRole('button', { name: '안내' });

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'open');

    fireEvent.pointerUp(button, { button: 0, pointerId: 1 });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'open');

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(screen.getByRole('tooltip')).toHaveAttribute('data-state', 'open');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('data-state', 'closing');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it.each(['top', 'right', 'bottom', 'left'] as const)('supports the %s position', (position) => {
    renderTooltip({ position });

    expect(screen.getByRole('tooltip')).toHaveAttribute('data-position', position);
  });

  it('preserves an existing aria-describedby value on the trigger', () => {
    render(
      <Tooltip message="안내">
        <button aria-describedby="existing-description" type="button">
          안내
        </button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: '안내' })).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining('existing-description'),
    );
  });
});
