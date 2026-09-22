import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DatePicker } from '@/shared/ui/date-picker';

afterEach(cleanup);

const selectedDate = new Date(2026, 1, 9);
const today = new Date(2026, 1, 7);

describe('DatePicker', () => {
  it('월 달력과 선택된 날짜, 오늘 상태를 렌더링한다', () => {
    render(<DatePicker aria-label="출발 날짜" today={today} value={selectedDate} />);

    expect(screen.getByRole('group', { name: '출발 날짜' })).toBeInTheDocument();
    expect(screen.getByText('2026년 2월')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: '2026년 2월' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026년 2월 9일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('button', { name: '2026년 2월 7일' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('날짜를 선택하면 선택 날짜를 콜백으로 전달한다', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: Date) => void>();

    render(<DatePicker onValueChange={handleValueChange} today={today} value={selectedDate} />);

    await user.click(screen.getByRole('button', { name: '2026년 2월 12일' }));

    expect(handleValueChange).toHaveBeenCalledWith(new Date(2026, 1, 12));
  });

  it('이전 달과 다음 달로 이동한다', async () => {
    const user = userEvent.setup();

    render(<DatePicker today={today} value={selectedDate} />);

    await user.click(screen.getByRole('button', { name: '다음 달' }));
    expect(screen.getByRole('grid', { name: '2026년 3월' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '이전 달' }));
    expect(screen.getByRole('grid', { name: '2026년 2월' })).toBeInTheDocument();
  });

  it('년월 버튼을 누르면 연도와 월 휠 선택기를 열고 값을 변경한다', async () => {
    const user = userEvent.setup();

    render(<DatePicker today={today} value={selectedDate} />);

    const monthToggle = screen.getByRole('button', { name: '2026년 2월' });
    await user.click(monthToggle);

    expect(monthToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: '연도' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: '월' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '2026년' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: '2월' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: '3월' }));
    expect(screen.getByText('2026년 3월')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('listbox', { name: '연도' }), { key: 'ArrowUp' });
    expect(screen.getByText('2025년 3월')).toBeInTheDocument();
  });

  it('휠 이동량이 임계치를 넘을 때만 월을 한 칸 이동한다', () => {
    render(<DatePicker today={today} value={selectedDate} />);

    fireEvent.click(screen.getByRole('button', { name: '2026년 2월' }));
    const monthColumn = screen.getByRole('listbox', { name: '월' });

    fireEvent.wheel(monthColumn, { deltaY: 119 });
    expect(screen.getByText('2026년 2월')).toBeInTheDocument();

    fireEvent.wheel(monthColumn, { deltaY: 1 });
    expect(screen.getByText('2026년 3월')).toBeInTheDocument();
  });

  it('비제어 모드에서 선택 날짜를 내부 상태로 갱신한다', async () => {
    const user = userEvent.setup();

    render(<DatePicker defaultValue={selectedDate} today={today} />);

    await user.click(screen.getByRole('button', { name: '2026년 2월 12일' }));

    expect(screen.getByRole('button', { name: '2026년 2월 12일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('최소 날짜보다 이전인 날짜는 선택할 수 없다', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: Date) => void>();

    render(
      <DatePicker
        minDate={new Date(2026, 1, 4)}
        onValueChange={handleValueChange}
        today={today}
        value={selectedDate}
      />,
    );

    const disabledDate = screen.getByRole('button', { name: '2026년 2월 3일' });
    expect(disabledDate).toBeDisabled();

    await user.click(disabledDate);
    expect(handleValueChange).not.toHaveBeenCalled();
  });
});
