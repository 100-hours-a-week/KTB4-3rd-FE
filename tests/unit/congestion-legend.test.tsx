import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CongestionLegend } from '@/entities/congestion';

describe('CongestionLegend', () => {
  it('혼잡도 범례의 상태를 설명 없이 표시한다', () => {
    const { container } = render(<CongestionLegend />);

    expect(screen.getByRole('group', { name: '혼잡도 범례' })).toBeInTheDocument();
    expect(screen.getByText('범례')).toBeInTheDocument();
    expect(screen.getByText('여유')).toBeInTheDocument();
    expect(screen.getByText('다소 혼잡')).toBeInTheDocument();
    expect(screen.getByText('매우 혼잡')).toBeInTheDocument();
    expect(screen.getByText('지연')).toBeInTheDocument();
    expect(screen.queryByText('제보 기반')).not.toBeInTheDocument();
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
