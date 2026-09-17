import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import { Input } from '@/shared/ui/input';

afterEach(cleanup);

describe('Input', () => {
  it('renders a controlled value and reports changes', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();

    render(
      <Input aria-label="계좌번호" onValueChange={handleValueChange} value="" placeholder="입력" />,
    );

    await user.type(screen.getByRole('textbox', { name: '계좌번호' }), '1234');

    expect(handleValueChange).toHaveBeenCalledTimes(4);
    expect(handleValueChange.mock.calls.at(-1)?.[0]).toBe('4');
  });

  it('renders prefix and suffix slots', () => {
    render(
      <Input
        aria-label="금액"
        onValueChange={() => {}}
        prefix={<span data-testid="prefix">₩</span>}
        suffix={<span data-testid="suffix">원</span>}
        value=""
      />,
    );

    expect(screen.getByTestId('prefix')).toBeInTheDocument();
    expect(screen.getByTestId('suffix')).toBeInTheDocument();
  });

  it('shows the clear button for a non-empty value and calls onClear', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn<() => void>();

    function ControlledInput() {
      const [value, setValue] = useState('1234');

      return (
        <Input
          aria-label="계좌번호"
          clearButton
          onClear={handleClear}
          onValueChange={setValue}
          value={value}
        />
      );
    }

    render(<ControlledInput />);

    await user.click(screen.getByRole('textbox', { name: '계좌번호' }));
    await user.click(screen.getByRole('button', { name: '입력값 지우기' }));

    const input = screen.getByRole('textbox', { name: '계좌번호' });

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(handleClear).toHaveBeenCalledOnce();
  });

  it('does not show the clear button when the value is empty', () => {
    render(<Input aria-label="계좌번호" clearButton onValueChange={() => {}} value="" />);

    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument();
  });

  it('applies size and invalid styles to the surface', () => {
    render(
      <Input
        aria-label="계좌번호"
        data-testid="input"
        invalid
        onValueChange={() => {}}
        size="sm"
        value=""
      />,
    );

    const input = screen.getByTestId('input');
    const surface = input.parentElement;

    expect(input).toHaveClass('flex-1');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(surface).toHaveClass('w-full');
    expect(input.parentElement?.parentElement).toHaveClass('w-[168px]');
    expect(input.parentElement).toHaveAttribute('data-invalid', 'true');
  });

  it('forwards native input props and disabled state', () => {
    render(
      <Input
        aria-label="계좌번호"
        autoComplete="off"
        disabled
        maxLength={20}
        name="accountNumber"
        onValueChange={() => {}}
        value=""
      />,
    );

    const input = screen.getByRole('textbox', { name: '계좌번호' });

    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('maxlength', '20');
    expect(input).toHaveAttribute('name', 'accountNumber');
  });
});
