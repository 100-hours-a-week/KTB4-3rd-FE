import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';

import { Select, type SelectOption } from '@/shared/ui/select';

afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-base-ui-portal]').forEach((portal) => portal.remove());
});

type Transport = 'taxi' | 'car' | 'subway';

const options: SelectOption<Transport>[] = [
  { value: 'taxi', label: '택시' },
  { value: 'car', label: '자차' },
  { value: 'subway', label: '지하철' },
];

describe('Select', () => {
  it('접근성 이름과 플레이스홀더를 렌더링한다', () => {
    render(
      <Select
        aria-label="이동수단"
        onValueChange={() => {}}
        options={options}
        placeholder="이동수단 선택"
        value={null}
      />,
    );

    expect(screen.getByRole('combobox', { name: '이동수단' })).toHaveTextContent('이동수단 선택');
  });

  it('팝업을 열고 선택한 옵션의 값을 전달한다', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: Transport | null) => void>();

    render(
      <Select
        aria-label="이동수단"
        onValueChange={handleValueChange}
        options={options}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));
    expect(screen.getByRole('option', { name: '택시' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: '지하철' }));

    expect(handleValueChange).toHaveBeenCalledWith('subway');
  });

  it('비활성화된 옵션은 선택하지 않는다', () => {
    const handleValueChange = vi.fn<(value: Transport | null) => void>();

    render(
      <Select
        aria-label="이동수단"
        onValueChange={handleValueChange}
        options={[...options.slice(0, 1), { ...options[1], disabled: true }]}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));

    const disabledOption = screen.getByRole('option', { name: '자차' });
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(disabledOption);

    expect(handleValueChange).not.toHaveBeenCalled();
  });

  it('항목 설명과 앞쪽 아이콘을 렌더링한다', () => {
    render(
      <Select
        aria-label="이동수단"
        onValueChange={() => {}}
        options={[
          {
            value: 'taxi',
            label: '택시',
            description: '출발지에서 목적지까지 바로 이동해요.',
            prefixIcon: <span data-testid="taxi-icon">택시 아이콘</span>,
          },
        ]}
        value={null}
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));

    expect(screen.getByText('출발지에서 목적지까지 바로 이동해요.')).toBeInTheDocument();
    expect(screen.getByTestId('taxi-icon')).toBeInTheDocument();
  });

  it('제어되는 선택값을 지원한다', async () => {
    const user = userEvent.setup();
    function ControlledSelect() {
      const [value, setValue] = useState<Transport | null>('taxi');

      return (
        <Select aria-label="이동수단" onValueChange={setValue} options={options} value={value} />
      );
    }

    render(<ControlledSelect />);

    const trigger = screen.getByRole('combobox', { name: '이동수단' });
    expect(trigger).toHaveTextContent('택시');

    fireEvent.click(trigger);
    await user.click(screen.getByRole('option', { name: '지하철' }));

    expect(trigger).toHaveTextContent('지하철');
  });

  it('오류 상태와 읽기 전용 상태를 적용한다', () => {
    render(
      <Select
        invalid
        aria-label="이동수단"
        onValueChange={() => {}}
        options={options}
        readOnly
        value="taxi"
      />,
    );

    const trigger = screen.getByRole('combobox', { name: '이동수단' });

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('data-invalid', 'true');
    expect(trigger).toHaveAttribute('data-readonly', 'true');
    expect(trigger).toHaveTextContent('택시');
  });

  it('읽기 전용이면 팝업을 열지 않는다', () => {
    render(
      <Select
        aria-label="이동수단"
        onValueChange={() => {}}
        options={options}
        readOnly
        value="taxi"
      />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));

    expect(screen.queryByRole('option', { name: '택시' })).not.toBeInTheDocument();
  });

  it('옵션이 없을 때 빈 상태를 표시한다', () => {
    render(<Select aria-label="이동수단" onValueChange={() => {}} options={[]} value={null} />);

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));

    expect(screen.getByRole('status')).toHaveTextContent('선택 가능한 항목이 없습니다');
  });

  it('컴포넌트가 비활성화되면 팝업을 열지 않는다', () => {
    render(
      <Select
        aria-label="이동수단"
        disabled
        onValueChange={() => {}}
        options={options}
        value={null}
      />,
    );

    const trigger = screen.getByRole('combobox', { name: '이동수단' });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);

    expect(screen.queryByRole('option', { name: '택시' })).not.toBeInTheDocument();
  });

  it('RHF 연결에 필요한 trigger ref와 blur 이벤트를 전달한다', () => {
    const ref = createRef<HTMLButtonElement>();
    const handleBlur = vi.fn<() => void>();

    render(
      <Select
        aria-label="이동수단"
        onBlur={handleBlur}
        onValueChange={() => {}}
        options={options}
        ref={ref}
        value={null}
      />,
    );

    expect(ref.current).toBe(screen.getByRole('combobox', { name: '이동수단' }));

    fireEvent.blur(screen.getByRole('combobox', { name: '이동수단' }));

    expect(handleBlur).toHaveBeenCalledOnce();
  });
});
