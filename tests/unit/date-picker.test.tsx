import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DatePicker } from '@/shared/ui/date-picker';

afterEach(cleanup);
afterEach(() => {
  vi.restoreAllMocks();
});

const selectedDate = new Date(2026, 1, 9);
const today = new Date(2026, 1, 7);

function getWheel(column: HTMLElement) {
  const wheel = column.querySelector('[data-rwp]');

  if (!(wheel instanceof HTMLElement)) {
    throw new Error('DatePicker 휠을 찾을 수 없습니다.');
  }

  return wheel;
}

function useImmediateAnimationFrame() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(performance.now() + 1000);
    return 0;
  });
}

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

  it('선택 날짜가 없으면 오늘의 년월과 오늘 날짜를 초기 표시한다', () => {
    render(<DatePicker aria-label="출발 날짜" today={today} value={null} />);

    expect(screen.getByText('2026년 2월')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: '2026년 2월' })).toBeInTheDocument();
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

  it('날짜 그리드에서 화살표 키로 포커스를 이동한다', async () => {
    const user = userEvent.setup();

    render(<DatePicker today={today} value={selectedDate} />);

    const selectedDay = screen.getByRole('button', { name: '2026년 2월 9일' });
    selectedDay.focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '2026년 2월 10일' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(selectedDay).toHaveFocus();
  });

  it('년월 버튼을 누르면 연도와 월 드래그 휠 선택기를 열고 값을 변경한다', async () => {
    useImmediateAnimationFrame();
    render(<DatePicker today={today} value={selectedDate} />);

    const monthToggle = screen.getByRole('button', { name: '2026년 2월' });
    fireEvent.click(monthToggle);

    expect(monthToggle).toHaveAttribute('aria-expanded', 'true');
    const yearColumn = screen.getByRole('listbox', { name: '연도' });
    const monthColumn = screen.getByRole('listbox', { name: '월' });

    expect(yearColumn).toHaveAttribute('aria-valuetext', '2026년');
    expect(monthColumn).toHaveAttribute('aria-valuetext', '2월');

    fireEvent.keyDown(getWheel(monthColumn), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2026년 3월' })).toBeInTheDocument();
    });

    fireEvent.keyDown(getWheel(yearColumn), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2025년 3월' })).toBeInTheDocument();
    });
  });

  it('마우스 드래그로 년도를 여러 칸 이동한다', async () => {
    useImmediateAnimationFrame();
    render(<DatePicker today={today} value={selectedDate} />);

    fireEvent.click(screen.getByRole('button', { name: '2026년 2월' }));
    const yearColumn = screen.getByRole('listbox', { name: '연도' });
    const yearWheel = getWheel(yearColumn);

    fireEvent.mouseDown(yearWheel, { clientY: 160 });
    fireEvent.mouseMove(document, { clientY: 34 });
    fireEvent.mouseUp(document, { clientY: 34 });

    await waitFor(() => {
      const nextYear = Number(yearColumn.getAttribute('data-selected-value'));

      expect(nextYear).toBeGreaterThan(2027);
    });
  });

  it('마우스 휠로 월을 한 칸 이동한다', async () => {
    useImmediateAnimationFrame();
    render(<DatePicker today={today} value={selectedDate} />);

    fireEvent.click(screen.getByRole('button', { name: '2026년 2월' }));
    const monthColumn = screen.getByRole('listbox', { name: '월' });

    fireEvent.wheel(getWheel(monthColumn), { deltaY: 120 });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2026년 3월' })).toBeInTheDocument();
    });
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
