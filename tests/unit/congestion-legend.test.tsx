import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CongestionLegend } from '@/entities/congestion';

describe('CongestionLegend', () => {
  it('혼잡도 범례의 상태와 범위를 표시한다', () => {
    const { container } = render(<CongestionLegend />);

    expect(screen.getByRole('group', { name: '혼잡도 범례' })).toBeInTheDocument();
    expect(screen.getByText('범례')).toBeInTheDocument();
    expect(screen.getByText('원활·여유')).toBeInTheDocument();
    expect(screen.getByText('대기 없음')).toBeInTheDocument();
    expect(screen.getByText('혼잡')).toBeInTheDocument();
    expect(screen.getByText('줄 서서 대기')).toBeInTheDocument();
    expect(screen.getByText('붐빔·만석')).toBeInTheDocument();
    expect(screen.getByText('탑승 실패·통제')).toBeInTheDocument();
    expect(screen.getByText('지연')).toBeInTheDocument();
    expect(screen.getAllByText('제보 기반')).toHaveLength(2);
    expect(screen.getByText('사고')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-congestion-legend-marker]')).toHaveLength(5);
  });
});
