import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState, type ComponentProps } from 'react';

import { Field } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { InputField } from '@/shared/ui/input-field';
import { Select, type SelectOption } from '@/shared/ui/select';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
});

const options: SelectOption[] = [
  { value: 'taxi', label: '택시' },
  { value: 'subway', label: '지하철' },
];

function renderInputField(props: Partial<ComponentProps<typeof Field>> = {}) {
  return render(
    <Field inputSlot={<Input onValueChange={() => {}} value="" />} label="댓글" {...props} />,
  );
}

describe('Field', () => {
  it('label을 input의 accessible name으로 연결한다', () => {
    renderInputField();

    expect(screen.getByRole('textbox', { name: '댓글' })).toBeInTheDocument();
  });

  it('header의 requirement mark와 suffix slot을 렌더링한다', () => {
    renderInputField({
      required: true,
      suffixSlot: <button type="button">도움말</button>,
    });

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '도움말' })).toBeInTheDocument();
  });

  it('helper text를 input과 연결한다', () => {
    renderInputField({ helperText: '최대 300자까지 입력할 수 있어요.' });

    const input = screen.getByRole('textbox', { name: '댓글' });
    const helperText = screen.getByText('최대 300자까지 입력할 수 있어요.');
    const helperDescription = helperText.closest('[id]');

    expect(helperDescription).not.toBeNull();
    expect(input).toHaveAttribute('aria-describedby', helperDescription?.id);
  });

  it('error message를 helper text 대신 표시하고 invalid 상태로 만든다', () => {
    renderInputField({
      errorMessage: '댓글을 입력해 주세요.',
      helperText: '최대 300자까지 입력할 수 있어요.',
    });

    const input = screen.getByRole('textbox', { name: '댓글' });
    const errorMessage = screen.getByText('댓글을 입력해 주세요.');
    const errorDescription = errorMessage.closest('[id]');

    expect(screen.queryByText('최대 300자까지 입력할 수 있어요.')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(errorDescription).not.toBeNull();
    expect(input).toHaveAttribute('aria-describedby', errorDescription?.id);
    expect(input.parentElement).toHaveAttribute('data-invalid', 'true');
  });

  it('character count를 footer 오른쪽에 표시한다', () => {
    renderInputField({ characterCount: 8, maxCharacterCount: 10 });

    expect(screen.getByLabelText('글자 수')).toHaveTextContent('8 / 10');
  });

  it('입력 슬롯에 Select를 연결한다', () => {
    render(
      <Field
        helperText="이동수단을 선택해 주세요."
        inputSlot={<Select onValueChange={() => {}} options={options} value={null} />}
        label="이동수단"
      />,
    );

    expect(screen.getByRole('combobox', { name: '이동수단' })).toBeInTheDocument();
  });

  it('disabled 상태를 field와 input에 적용한다', () => {
    renderInputField({ disabled: true });

    const input = screen.getByRole('textbox', { name: '댓글' });

    expect(input).toBeDisabled();
    expect(input.parentElement).toHaveAttribute('data-disabled', 'true');
    expect(input.parentElement?.parentElement?.parentElement).toHaveAttribute('data-disabled');
  });
});

describe('InputField', () => {
  it('기존 InputField API로 controlled 입력을 지원한다', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();

    function ControlledField() {
      const [value, setValue] = useState('');

      return (
        <InputField
          helperText="최대 300자까지 입력할 수 있어요."
          label="댓글"
          onValueChange={(nextValue) => {
            handleValueChange(nextValue);
            setValue(nextValue);
          }}
          value={value}
        />
      );
    }

    render(<ControlledField />);

    await user.type(screen.getByRole('textbox', { name: '댓글' }), '안녕');

    expect(handleValueChange).toHaveBeenLastCalledWith('안녕');
    expect(screen.getByText('최대 300자까지 입력할 수 있어요.')).toBeInTheDocument();
  });

  it('외부 invalid 상태를 error message 없이 전달한다', () => {
    render(<InputField invalid label="댓글" onValueChange={() => {}} value="" />);

    expect(screen.getByRole('textbox', { name: '댓글' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('required와 disabled 상태를 Field와 Input에 함께 전달한다', () => {
    render(<InputField disabled label="댓글" onValueChange={() => {}} required value="" />);

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '댓글' })).toBeDisabled();
    expect(screen.getByText('댓글').closest('[data-disabled]')).not.toBeNull();
  });
});
