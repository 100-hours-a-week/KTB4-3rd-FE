import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Button } from '@/shared/ui/button';

afterEach(cleanup);

describe('Button', () => {
  it('renders its label and handles a press', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();

    render(<Button onClick={handleClick}>확인</Button>);

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('renders prefix and suffix icons', () => {
    render(
      <Button
        prefixIcon={<span data-testid="prefix-icon" />}
        suffixIcon={<span data-testid="suffix-icon" />}
      >
        확인
      </Button>,
    );

    expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
    expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
  });

  it('disables itself and shows a busy state while loading', () => {
    render(<Button loading>확인</Button>);

    const button = screen.getByRole('button', { name: '확인' });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('disables itself when disabled', () => {
    render(<Button disabled>확인</Button>);

    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });

  it('supports hug and fill widths', () => {
    const { rerender } = render(<Button>Hug</Button>);

    expect(screen.getByRole('button', { name: 'Hug' })).toHaveClass('w-fit');

    rerender(<Button width="fill">Fill</Button>);

    expect(screen.getByRole('button', { name: 'Fill' })).toHaveClass('w-full');
  });

  it('forwards native button props', () => {
    render(
      <Button aria-label="닫기" data-testid="button" type="submit">
        <span aria-hidden="true">×</span>
      </Button>,
    );

    const button = screen.getByTestId('button');

    expect(button).toHaveAttribute('aria-label', '닫기');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
