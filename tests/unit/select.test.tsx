import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';

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
  it('renders its label and placeholder', () => {
    render(
      <Select
        label="이동수단"
        onValueChange={() => {}}
        options={options}
        placeholder="이동수단 선택"
        value={null}
      />,
    );

    expect(screen.getByText('이동수단')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '이동수단' })).toHaveTextContent('이동수단 선택');
  });

  it('opens the popup and reports the selected option', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: Transport | null) => void>();

    render(
      <Select label="이동수단" onValueChange={handleValueChange} options={options} value={null} />,
    );

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));
    expect(screen.getByRole('option', { name: '택시' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: '지하철' }));

    expect(handleValueChange).toHaveBeenCalledWith('subway');
  });

  it('does not select a disabled option', () => {
    const handleValueChange = vi.fn<(value: Transport | null) => void>();

    render(
      <Select
        label="이동수단"
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

  it('renders item descriptions and prefix icons', () => {
    render(
      <Select
        label="이동수단"
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

  it('supports a controlled selected value', async () => {
    const user = userEvent.setup();
    function ControlledSelect() {
      const [value, setValue] = useState<Transport | null>('taxi');

      return <Select label="이동수단" onValueChange={setValue} options={options} value={value} />;
    }

    render(<ControlledSelect />);

    const trigger = screen.getByRole('combobox', { name: '이동수단' });
    expect(trigger).toHaveTextContent('택시');

    fireEvent.click(trigger);
    await user.click(screen.getByRole('option', { name: '지하철' }));

    expect(trigger).toHaveTextContent('지하철');
  });

  it('applies invalid and read-only states', () => {
    render(
      <Select
        invalid
        label="이동수단"
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

  it('shows an empty state when there are no options', () => {
    render(<Select label="이동수단" onValueChange={() => {}} options={[]} value={null} />);

    fireEvent.click(screen.getByRole('combobox', { name: '이동수단' }));

    expect(screen.getByRole('status')).toHaveTextContent('선택 가능한 항목이 없습니다');
  });

  it('does not open when disabled', () => {
    render(
      <Select disabled label="이동수단" onValueChange={() => {}} options={options} value={null} />,
    );

    const trigger = screen.getByRole('combobox', { name: '이동수단' });
    expect(trigger).toBeDisabled();

    fireEvent.click(trigger);

    expect(screen.queryByRole('option', { name: '택시' })).not.toBeInTheDocument();
  });
});
