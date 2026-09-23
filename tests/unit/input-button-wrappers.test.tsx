import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DateInputButton } from '@/shared/ui/date-input-button';
import { LocationInputButton } from '@/shared/ui/location-input-button';
import { TimeInputButton } from '@/shared/ui/time-input-button';

afterEach(cleanup);

describe('DateInputButton', () => {
  it('날짜를 기본 표시 형식으로 렌더링한다', () => {
    render(<DateInputButton value={new Date(2026, 8, 23)} />);

    expect(screen.getByRole('button', { name: '날짜 선택' })).toHaveTextContent('2026.09.23');
    expect(screen.getByRole('button', { name: '입력값 지우기' })).toBeInTheDocument();
  });

  it('버튼을 누르면 날짜 선택 바텀시트를 열고 선택한 값을 적용한다', async () => {
    render(<DateInputButton datePickerProps={{ today: new Date(2026, 8, 23) }} />);

    fireEvent.click(screen.getByRole('button', { name: '날짜 선택' }));

    expect(screen.getByRole('heading', { name: '날짜' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026년 9월 23일' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: '2026년 9월 25일' }));
    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '날짜' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '날짜 선택' })).toHaveTextContent('2026.09.25');
  });

  it('사용처에서 바텀시트 제목을 지정할 수 있다', () => {
    render(<DateInputButton bottomSheetTitle="약속 날짜" />);

    fireEvent.click(screen.getByRole('button', { name: '날짜 선택' }));

    expect(screen.getByRole('heading', { name: '약속 날짜' })).toBeInTheDocument();
  });
});

describe('TimeInputButton', () => {
  it('시간을 기본 표시 형식으로 렌더링한다', () => {
    render(<TimeInputButton value={{ period: '오후', hour: 6, minute: 40 }} />);

    expect(screen.getByRole('button', { name: '시간 선택' })).toHaveTextContent('오후 6:40');
  });

  it('버튼을 누르면 시간 선택 바텀시트를 열고 선택한 값을 적용한다', async () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(performance.now() + 1000);
      return 0;
    });

    render(<TimeInputButton />);

    fireEvent.click(screen.getByRole('button', { name: '시간 선택' }));

    expect(screen.getByRole('heading', { name: '시간' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '초기화' })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog').at(-1)).toHaveStyle({ minHeight: 'auto' });

    const minuteWheel = screen.getByRole('listbox', { name: '분' }).querySelector('[data-rwp]');

    if (!(minuteWheel instanceof HTMLElement)) {
      throw new Error('분 휠을 찾을 수 없습니다.');
    }

    fireEvent.keyDown(minuteWheel, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByRole('listbox', { name: '분' })).toHaveAttribute('aria-valuetext', '50');
    });

    fireEvent.click(screen.getByRole('button', { name: '선택' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '시간' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: '시간 선택' })).toHaveTextContent('오후 6:50');
  });

  it('사용처에서 바텀시트 제목을 지정할 수 있다', () => {
    render(<TimeInputButton bottomSheetTitle="약속 시간" />);

    fireEvent.click(screen.getByRole('button', { name: '시간 선택' }));

    expect(screen.getByRole('heading', { name: '약속 시간' })).toBeInTheDocument();
  });
});

describe('LocationInputButton', () => {
  it('장소 placeholder와 선택한 장소를 렌더링한다', () => {
    const { rerender } = render(<LocationInputButton value={null} />);

    expect(screen.getByRole('button', { name: '장소 선택' })).toHaveTextContent(
      '장소를 선택해 주세요',
    );

    rerender(<LocationInputButton value="판교역 2번 출구" />);

    expect(screen.getByRole('button', { name: '장소 선택' })).toHaveTextContent('판교역 2번 출구');
  });
});
