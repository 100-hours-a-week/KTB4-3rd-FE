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

  it('화면별 제목과 혼잡도 구간을 전달할 수 있다', () => {
    const { container } = render(
      <CongestionLegend
        heading="혼잡도"
        items={[
          { color: '#CCE9FF', label: '원활·여유', range: '0~40' },
          { color: '#FBDC65', label: '혼잡', range: '41~70' },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: '혼잡도' })).toBeInTheDocument();
    expect(screen.getByText('0~40')).toBeInTheDocument();
    expect(screen.getByText('41~70')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-congestion-legend-marker]')).toHaveLength(2);
  });
});
