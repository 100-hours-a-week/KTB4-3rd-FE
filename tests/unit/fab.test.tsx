import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Fab } from '@/shared/ui/fab';

afterEach(cleanup);

describe('Fab', () => {
  it('renders its label and both slots', () => {
    render(
      <Fab
        leftSlot={<span data-testid="left-slot" />}
        rightSlot={<span data-testid="right-slot" />}
      >
        글쓰기
      </Fab>,
    );

    expect(screen.getByRole('button', { name: '글쓰기' })).toBeInTheDocument();
    expect(screen.getByTestId('left-slot')).toBeInTheDocument();
    expect(screen.getByTestId('right-slot')).toBeInTheDocument();
  });

  it('uses the FAB dimensions and default brand variant', () => {
    render(<Fab>글쓰기</Fab>);

    expect(screen.getByRole('button', { name: '글쓰기' })).toHaveClass(
      '!h-[var(--dimension-x12)]',
      '!gap-[var(--dimension-x2)]',
      '!rounded-full',
      '!border-[var(--color-stroke-neutral-subtle)]',
      'bg-[var(--color-bg-brand-solid)]',
    );
  });

  it('forwards button behavior and props', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();

    render(
      <Fab aria-label="새 글쓰기" data-testid="fab" onClick={handleClick} variant="neutral-solid">
        글쓰기
      </Fab>,
    );

    const button = screen.getByTestId('fab');

    expect(button).toHaveAttribute('aria-label', '새 글쓰기');
    expect(button).toHaveClass('bg-[var(--color-bg-neutral-inverted)]');

    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
