import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TimePicker, type TimePickerValue } from '@/shared/ui/time-picker';

afterEach(cleanup);

afterEach(() => {
  vi.restoreAllMocks();
});

const defaultTime: TimePickerValue = {
  period: '오후',
  hour: 6,
  minute: 40,
};

function getColumn(name: string) {
  return screen.getByRole('listbox', { name });
}

function getWheel(column: HTMLElement) {
  const wheel = column.querySelector('[data-rwp]');

  if (!(wheel instanceof HTMLElement)) {
    throw new Error('Wheel Picker 컬럼을 찾을 수 없습니다.');
  }

  return wheel;
}

function useImmediateAnimationFrame() {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    callback(performance.now() + 1000);
    return 0;
  });
}

describe('TimePicker', () => {
  it('Figma 기본 상태와 오전/오후, 시, 분 컬럼을 렌더링한다', () => {
    render(<TimePicker aria-label="출발 시간" defaultValue={defaultTime} />);

    expect(screen.getByRole('group', { name: '출발 시간' })).toBeInTheDocument();
    expect(getColumn('오전 또는 오후')).toHaveAttribute('aria-valuetext', '오후');
    expect(getColumn('시')).toHaveAttribute('aria-valuetext', '6');
    expect(getColumn('분')).toHaveAttribute('aria-valuetext', '40');
  });

  it('선택 영역에는 현재 값의 강조 텍스트가 렌더링된다', () => {
    render(<TimePicker defaultValue={defaultTime} />);

    const minuteColumn = getColumn('분');
    const highlightedTexts = Array.from(
      minuteColumn.querySelectorAll('[data-rwp-highlight-item] .time-picker-wheel-text'),
    ).map((element) => element.textContent);
    const optionTexts = Array.from(
      minuteColumn.querySelectorAll('[data-rwp-option] .time-picker-wheel-text'),
    ).map((element) => element.textContent);

    expect(highlightedTexts).toContain('40');
    expect(optionTexts).toContain('00');
  });

  it('오전/오후와 10분 단위 값을 선택해 콜백으로 전달한다', async () => {
    useImmediateAnimationFrame();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(
      <TimePicker
        defaultValue={{ period: '오후', hour: 6, minute: 0 }}
        onValueChange={handleValueChange}
      />,
    );

    fireEvent.keyDown(getWheel(getColumn('오전 또는 오후')), { key: 'ArrowUp' });
    await waitFor(() => {
      expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오전', hour: 6, minute: 0 });
    });

    fireEvent.keyDown(getWheel(getColumn('분')), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오전', hour: 6, minute: 10 });
    });
  });

  it('키보드 방향키로 이전/다음 시간을 선택한다', async () => {
    useImmediateAnimationFrame();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    fireEvent.keyDown(getWheel(getColumn('시')), { key: 'ArrowDown' });

    await waitFor(() => {
      expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 7, minute: 40 });
    });
  });

  it('시와 분을 경계에서 다음 값으로 순환한다', async () => {
    useImmediateAnimationFrame();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(
      <TimePicker
        defaultValue={{ period: '오후', hour: 12, minute: 50 }}
        onValueChange={handleValueChange}
      />,
    );

    fireEvent.keyDown(getWheel(getColumn('시')), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 1, minute: 50 });
    });

    fireEvent.keyDown(getWheel(getColumn('분')), { key: 'ArrowDown' });
    await waitFor(() => {
      expect(handleValueChange).toHaveBeenLastCalledWith({ period: '오후', hour: 1, minute: 0 });
    });
  });

  it('휠 스크롤을 한 칸 스냅한 뒤 다음 값으로 변경한다', async () => {
    useImmediateAnimationFrame();
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    fireEvent.wheel(getWheel(getColumn('분')), { deltaY: 120 });

    await waitFor(() => {
      expect(handleValueChange).toHaveBeenCalledWith({ period: '오후', hour: 6, minute: 50 });
    });
  });

  it('터치 드래그로 여러 행을 한 번에 이동한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const minuteWheel = getWheel(getColumn('분'));
    fireEvent.touchStart(minuteWheel, { touches: [{ clientY: 160 }] });
    fireEvent.touchMove(minuteWheel, { touches: [{ clientY: 34 }] });
    fireEvent.touchEnd(minuteWheel);

    expect(handleValueChange).toHaveBeenCalled();
  });

  it('마우스 드래그로 여러 행을 한 번에 이동한다', () => {
    const handleValueChange = vi.fn<(value: TimePickerValue) => void>();

    render(<TimePicker defaultValue={defaultTime} onValueChange={handleValueChange} />);

    const minuteWheel = getWheel(getColumn('분'));
    fireEvent.mouseDown(minuteWheel, { clientY: 160 });
    fireEvent.mouseMove(document, { clientY: 34 });
    fireEvent.mouseUp(document, { clientY: 34 });

    expect(handleValueChange).toHaveBeenCalled();
  });

  it('비제어 모드에서 선택값을 내부 상태로 갱신한다', async () => {
    useImmediateAnimationFrame();
    render(<TimePicker defaultValue={{ period: '오후', hour: 6, minute: 0 }} />);

    const minuteColumn = getColumn('분');
    fireEvent.keyDown(getWheel(minuteColumn), { key: 'ArrowDown' });

    await waitFor(() => {
      expect(minuteColumn).toHaveAttribute('aria-valuetext', '10');
    });
  });
});
