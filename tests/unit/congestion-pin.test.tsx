import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CongestionPin } from '@/entities/congestion';
import { CongestionPinSelect } from '@/features/congestion';

afterEach(() => {
  cleanup();
});

describe('CongestionPin', () => {
  it('선택 상태에서 피그마 안내 문구와 선택 상태를 표시한다', () => {
    render(<CongestionPin isSelected variant="delayed" />);

    const pin = screen.getByRole('button', { name: '지연 혼잡도 핀' });

    expect(pin).toHaveAttribute('aria-pressed', 'true');
    expect(pin).toHaveAttribute('data-congestion-pin-state', 'selected');
    expect(screen.getByText(/퇴근길 인파로 지연이/)).toBeInTheDocument();
    expect(screen.getByText(/5분정도 있어요/)).toBeInTheDocument();
  });
});

describe('CongestionPinSelect', () => {
  it('클릭할 때 선택 상태를 전환하고 변경 이벤트를 호출한다', () => {
    const onSelectedChange = vi.fn<(isSelected: boolean) => void>();
    render(<CongestionPinSelect onSelectedChange={onSelectedChange} variant="delayed" />);

    const pin = screen.getByRole('button', { name: '지연 혼잡도 핀' });

    expect(pin).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(pin);
    expect(pin).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectedChange).toHaveBeenCalledWith(true);

    fireEvent.click(pin);
    expect(pin).toHaveAttribute('aria-pressed', 'false');
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
  });
});
