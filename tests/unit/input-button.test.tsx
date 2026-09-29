import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';

import { InputButton } from '@/shared/ui/input-button';

afterEach(cleanup);

describe('InputButton', () => {
  it('접근성 이름과 플레이스홀더를 렌더링한다', () => {
    render(
      <InputButton aria-label="이동수단" placeholder="이동수단을 선택해 주세요" value={null} />,
    );

    expect(screen.getByRole('button', { name: '이동수단' })).toHaveTextContent(
      '이동수단을 선택해 주세요',
    );
  });

  it('선택된 값과 prefix, suffix 슬롯을 렌더링한다', () => {
    render(
      <InputButton
        aria-label="이동수단"
        prefix={<span data-testid="prefix">앞</span>}
        suffix={<span data-testid="suffix">뒤</span>}
        value="지하철"
      />,
    );

    expect(screen.getByRole('button', { name: '이동수단' })).toHaveTextContent('지하철');
    expect(screen.getByTestId('prefix')).toBeInTheDocument();
    expect(screen.getByTestId('suffix')).toBeInTheDocument();
  });

  it('활성 상태에서 클릭 이벤트를 전달한다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();

    render(<InputButton aria-label="이동수단" onClick={handleClick} value={null} />);

    await user.click(screen.getByRole('button', { name: '이동수단' }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('읽기 전용 상태에서는 클릭 이벤트를 전달하지 않는다', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();

    render(<InputButton aria-label="이동수단" onClick={handleClick} readOnly value="지하철" />);

    const trigger = screen.getByRole('button', { name: '이동수단' });
    await user.click(trigger);

    expect(handleClick).not.toHaveBeenCalled();
    expect(trigger).toHaveAttribute('aria-readonly', 'true');
    expect(trigger).toHaveAttribute('data-readonly', 'true');
  });

  it('값이 있을 때 clear button을 표시하고 trigger를 유지한다', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn<() => void>();
    const handleClick = vi.fn<() => void>();

    render(
      <InputButton
        aria-label="이동수단"
        clearButton
        onClear={handleClear}
        onClick={handleClick}
        value="지하철"
      />,
    );

    const trigger = screen.getByRole('button', { name: '이동수단' });
    const clearButton = screen.getByRole('button', { name: '입력값 지우기' });

    await user.click(clearButton);

    expect(handleClear).toHaveBeenCalledOnce();
    expect(handleClick).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('제어되는 값과 clear button을 함께 사용할 수 있다', async () => {
    const user = userEvent.setup();

    function ControlledInputButton() {
      const [value, setValue] = useState<string | null>('지하철');

      return (
        <InputButton
          aria-label="이동수단"
          clearButton
          onClear={() => setValue(null)}
          value={value}
        />
      );
    }

    render(<ControlledInputButton />);

    await user.click(screen.getByRole('button', { name: '입력값 지우기' }));

    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이동수단' })).toHaveTextContent('선택해 주세요');
  });

  it('값이 없거나 disabled, readOnly이면 clear button을 표시하지 않는다', () => {
    const { rerender } = render(<InputButton aria-label="이동수단" clearButton value={null} />);

    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument();

    rerender(<InputButton aria-label="이동수단" clearButton disabled value="지하철" />);
    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument();

    rerender(<InputButton aria-label="이동수단" clearButton readOnly value="지하철" />);
    expect(screen.queryByRole('button', { name: '입력값 지우기' })).not.toBeInTheDocument();
  });

  it('오류, disabled 상태와 native button props를 적용한다', () => {
    const ref = createRef<HTMLButtonElement>();

    render(
      <InputButton
        aria-label="이동수단"
        data-testid="trigger"
        disabled
        id="transport"
        invalid
        name="transport"
        ref={ref}
        value={null}
      />,
    );

    const trigger = screen.getByTestId('trigger');
    const surface = trigger.parentElement;

    expect(ref.current).toBe(trigger);
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('data-invalid', 'true');
    expect(trigger).toHaveAttribute('id', 'transport');
    expect(trigger).toHaveAttribute('name', 'transport');
    expect(surface).toHaveAttribute('data-disabled', 'true');
    expect(surface).toHaveAttribute('data-invalid', 'true');
  });

  it('기본 type은 submit이 아닌 button이다', () => {
    render(<InputButton aria-label="이동수단" value={null} />);

    expect(screen.getByRole('button', { name: '이동수단' })).toHaveAttribute('type', 'button');
  });

  it('clear button의 pointer down이 trigger focus를 빼앗지 않는다', () => {
    render(<InputButton aria-label="이동수단" clearButton value="지하철" />);

    const trigger = screen.getByRole('button', { name: '이동수단' });
    const clearButton = screen.getByRole('button', { name: '입력값 지우기' });

    trigger.focus();
    fireEvent.mouseDown(clearButton);

    expect(trigger).toHaveFocus();
  });
});
