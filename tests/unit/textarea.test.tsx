import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

import { Textarea } from '@/shared/ui/textarea';

afterEach(cleanup);

describe('Textarea', () => {
  it('renders a controlled value and reports changes', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();

    function ControlledTextarea() {
      const [value, setValue] = useState('');

      return (
        <Textarea
          aria-label="댓글"
          onValueChange={(nextValue) => {
            handleValueChange(nextValue);
            setValue(nextValue);
          }}
          placeholder="입력"
          value={value}
        />
      );
    }

    render(<ControlledTextarea />);

    await user.type(screen.getByRole('textbox', { name: '댓글' }), '안녕');

    expect(handleValueChange).toHaveBeenLastCalledWith('안녕');
    expect(screen.getByRole('textbox', { name: '댓글' })).toHaveValue('안녕');
  });

  it('applies the Figma height variants to the surface', () => {
    const { rerender } = render(<Textarea aria-label="댓글" onValueChange={() => {}} value="" />);

    const textarea = screen.getByRole('textbox', { name: '댓글' });
    const surface = textarea.parentElement;

    expect(surface).toHaveClass('h-[95px]');

    rerender(<Textarea aria-label="댓글" autoSize={false} onValueChange={() => {}} value="" />);

    expect(textarea.parentElement).toHaveClass('h-[120px]');
  });

  it('applies invalid state to the surface and native textarea', () => {
    render(
      <Textarea
        aria-label="댓글"
        data-testid="textarea"
        invalid
        onValueChange={() => {}}
        value=""
      />,
    );

    const textarea = screen.getByTestId('textarea');

    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea.parentElement).toHaveAttribute('data-invalid', 'true');
  });

  it('forwards native textarea props and disabled state', () => {
    render(
      <Textarea
        aria-label="댓글"
        autoComplete="off"
        disabled
        maxLength={300}
        name="comment"
        onValueChange={() => {}}
        rows={4}
        value=""
      />,
    );

    const textarea = screen.getByRole('textbox', { name: '댓글' });

    expect(textarea).toBeDisabled();
    expect(textarea).toHaveAttribute('autocomplete', 'off');
    expect(textarea).toHaveAttribute('maxlength', '300');
    expect(textarea).toHaveAttribute('name', 'comment');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea.parentElement).toHaveAttribute('data-disabled', 'true');
  });

  it('applies the read-only state without disabling the textarea', () => {
    render(<Textarea aria-label="댓글" onValueChange={() => {}} readOnly value="읽기 전용" />);

    const textarea = screen.getByRole('textbox', { name: '댓글' });

    expect(textarea).toHaveAttribute('readonly');
    expect(textarea).not.toBeDisabled();
    expect(textarea.parentElement).toHaveAttribute('data-readonly', 'true');
  });
});
