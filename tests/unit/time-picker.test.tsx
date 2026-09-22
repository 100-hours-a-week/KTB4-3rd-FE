import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimePicker, type TimePickerValue } from '@/shared/ui/time-picker';

afterEach(cleanup);

const defaultTime: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

describe('TimePicker', () => {
  it('Figma 기본 상태와 오전/오후, 시, 분 컬럼을 렌더링한다', () => {
    render(<TimePicker aria-label="출발 시간" defaultValue={defaultTime} />);

    expect(screen.getByRole('group', { name: '출발 시간' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '오전 또는 오후' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '시' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '분' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '오후' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: '6' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: '40' })).toHaveAttribute('aria-selected', 'true');
  });

  it('오전/오후와 10분 단위 값을 선택해 콜백으로 전달한다', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(
      <TimePicker
        onValueChange={handleValueChange}
        value={{ period: '오후', hour: 6, minute: 0 }}
      />,
    );

    await user.click(screen.getByRole('option', { name: '오전' }));
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오전', hour: 6, minute: 0 });

    await user.click(screen.getByRole('option', { name: '10' }));
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 6, minute: 10 });
  });

  it('키보드와 휠로 이전/다음 시간을 선택한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker onValueChange={handleValueChange} value={defaultTime} />);

    const hourColumn = screen.getByRole('listbox', { name: '시' });
    const minuteColumn = screen.getByRole('listbox', { name: '분' });

    fireEvent.keyDown(hourColumn, { key: 'ArrowDown' });
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 7, minute: 40 });

    fireEvent.wheel(minuteColumn, { deltaY: 60 });
    expect(handleValueChange).toHaveBeenCalledTimes(1);

    fireEvent.wheel(minuteColumn, { deltaY: 60 });
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 6, minute: 50 });
  });

  it('휠 이동량이 임계치를 넘을 때만 한 칸 이동한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker onValueChange={handleValueChange} value={defaultTime} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });

    fireEvent.wheel(minuteColumn, { deltaY: 119 });
    expect(handleValueChange).not.toHaveBeenCalled();

    fireEvent.wheel(minuteColumn, { deltaY: 1 });
    expect(handleValueChange).toHaveBeenCalledOnce();
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 6, minute: 50 });
  });

  it('위로 드래그하는 동안 숫자 목록이 함께 움직이고 손을 놓으면 다음 값으로 스냅한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker onValueChange={handleValueChange} value={defaultTime} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    const optionList = minuteColumn.firstElementChild;

    fireEvent.pointerDown(minuteColumn, { button: 0, clientY: 160, pointerId: 1 });
    fireEvent.pointerMove(minuteColumn, { clientY: 120, pointerId: 1 });

    expect(optionList).toHaveStyle({ transform: 'translateY(-34px)' });
    expect(handleValueChange).not.toHaveBeenCalled();

    fireEvent.pointerUp(minuteColumn, { clientY: 110, pointerId: 1 });

    expect(handleValueChange).toHaveBeenCalledWith({ period: '오후', hour: 6, minute: 50 });
  });

  it('비제어 모드에서 선택값을 내부 상태로 갱신한다', async () => {
    const user = userEvent.setup();

    render(<TimePicker defaultValue={{ period: '오후', hour: 6, minute: 0 }} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    await user.click(screen.getByRole('option', { name: '10' }));

    expect(minuteColumn.querySelector('[aria-selected="true"]')).toHaveTextContent('10');
  });
});
