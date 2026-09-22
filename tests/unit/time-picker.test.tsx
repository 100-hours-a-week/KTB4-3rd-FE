import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimePicker, type TimePickerValue } from '@/shared/ui/time-picker';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const defaultTime: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

function getSelectedOption(column: HTMLElement) {
  return within(column).getByRole('option', { selected: true });
}

describe('TimePicker', () => {
  it('Figma 기본 상태와 오전/오후, 시, 분 컬럼을 렌더링한다', () => {
    render(<TimePicker aria-label="출발 시간" defaultValue={defaultTime} />);

    expect(screen.getByRole('group', { name: '출발 시간' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '오전 또는 오후' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '시' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '분' })).toBeInTheDocument();
    expect(
      getSelectedOption(screen.getByRole('listbox', { name: '오전 또는 오후' })),
    ).toHaveTextContent('오후');
    expect(getSelectedOption(screen.getByRole('listbox', { name: '시' }))).toHaveTextContent('6');
    expect(getSelectedOption(screen.getByRole('listbox', { name: '분' }))).toHaveTextContent('40');
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

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    const tenMinuteOptions = within(minuteColumn).getAllByRole('option', { name: '10' });
    await user.click(tenMinuteOptions[Math.floor(tenMinuteOptions.length / 2)]);
    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 6, minute: 10 });
  });

  it('키보드 방향키로 이전/다음 시간을 선택한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const hourColumn = screen.getByRole('listbox', { name: '시' });
    fireEvent.keyDown(hourColumn, { key: 'ArrowDown' });

    expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 7, minute: 40 });
  });

  it('휠 스크롤을 한 칸 스냅한 뒤 다음 값으로 변경한다', async () => {
    vi.useFakeTimers();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    fireEvent.wheel(minuteColumn, { deltaY: 120 });

    expect(handleValueChange).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(handleValueChange).toHaveBeenCalledWith({ period: '오후', hour: 6, minute: 50 });
  });

  it('여러 행을 터치 드래그하면 중간에 멈추지 않고 연속된 값으로 스냅한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });

    fireEvent.touchStart(minuteColumn, {
      targetTouches: [{ pageY: 160 }],
    });
    fireEvent.touchMove(minuteColumn, {
      targetTouches: [{ pageY: 34 }],
    });

    expect(handleValueChange).not.toHaveBeenCalled();

    fireEvent.touchEnd(minuteColumn);

    expect(handleValueChange).toHaveBeenCalledWith({ period: '오후', hour: 6, minute: 10 });
    expect(getSelectedOption(minuteColumn)).toHaveTextContent('10');
  });

  it('데스크톱 마우스 드래그도 여러 행을 한 번에 이동한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });

    fireEvent.pointerDown(minuteColumn, {
      button: 0,
      clientY: 160,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerMove(minuteColumn, {
      clientY: 34,
      pointerId: 1,
      pointerType: 'mouse',
    });
    fireEvent.pointerUp(minuteColumn, {
      clientY: 34,
      pointerId: 1,
      pointerType: 'mouse',
    });

    expect(handleValueChange).toHaveBeenCalledWith({ period: '오후', hour: 6, minute: 10 });
    expect(getSelectedOption(minuteColumn)).toHaveTextContent('10');
  });

  it('선택 영역의 텍스트 스타일을 선택 상태에 맞게 적용한다', () => {
    render(<TimePicker value={defaultTime} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    const selectedOption = getSelectedOption(minuteColumn);
    const unselectedOption = within(minuteColumn).getByRole('option', { name: '30' });

    expect(selectedOption.firstElementChild).toHaveStyle({
      color: 'rgb(29, 41, 57)',
      fontSize: '24px',
      fontWeight: '700',
    });
    expect(unselectedOption.firstElementChild).toHaveStyle({
      color: 'rgb(152, 162, 179)',
      fontSize: '22px',
      fontWeight: '400',
    });
  });

  it('비제어 모드에서 선택값을 내부 상태로 갱신한다', async () => {
    const user = userEvent.setup();

    render(<TimePicker defaultValue={{ period: '오후', hour: 6, minute: 0 }} />);

    const minuteColumn = screen.getByRole('listbox', { name: '분' });
    const tenMinuteOptions = within(minuteColumn).getAllByRole('option', { name: '10' });
    await user.click(tenMinuteOptions[Math.floor(tenMinuteOptions.length / 2)]);

    expect(getSelectedOption(minuteColumn)).toHaveTextContent('10');
  });
});
