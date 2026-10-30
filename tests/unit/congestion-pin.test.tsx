import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CongestionPin, getCongestionPinMarkerImage } from '@/entities/congestion';
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

  it.each([
    ['accident', '#1A1C20'],
    ['available', '#0099FF'],
    ['busy', '#FA342C'],
    ['congested', '#FBDC65'],
    ['delayed', '#FA9D2C'],
  ] as const)('확장 상태에서도 %s 기본 핀의 배경색을 유지한다', (variant, color) => {
    const { container } = render(<CongestionPin isSelected variant={variant} />);

    expect(container.querySelector('[data-congestion-pin-selected-background]')).toHaveStyle({
      backgroundColor: color,
    });
  });

  it.each([
    ['accident', '#FFFFFF'],
    ['available', '#FFFFFF'],
    ['busy', '#FFFFFF'],
    ['congested', '#111111'],
    ['delayed', '#111111'],
  ] as const)(
    '지도에서 확장된 %s marker도 기본 핀의 글씨 색상을 사용한다',
    (variant, textColor) => {
      const markerImage = getCongestionPinMarkerImage(variant, {
        isSelected: true,
        selectedMessage: '탑승 대기 인원이 많아요',
      });
      const svg = decodeURIComponent(markerImage.src.split(',')[1] ?? '');

      expect(svg).toContain(`fill="${textColor}"`);
      expect(svg).toContain('탑승 대기 인원이');
      expect(svg).toContain('많아요');
    },
  );

  it('지도에서 확장된 marker의 긴 문장을 핀 너비에 맞춰 줄바꿈한다', () => {
    const markerImage = getCongestionPinMarkerImage('available', {
      isSelected: true,
      selectedMessage: '현재 여유로운 상태예요',
    });
    const svg = decodeURIComponent(markerImage.src.split(',')[1] ?? '');

    expect(svg).toContain('<text x="59.5" y="28" text-anchor="middle"');
    expect(svg).toContain('<tspan x="59.5" dy="0">현재 여유로운</tspan>');
    expect(svg).toContain('<tspan x="59.5" dy="15">상태예요</tspan>');
  });

  it('기본 marker도 확장 marker와 같은 캔버스와 기준점을 사용한다', () => {
    const defaultMarker = getCongestionPinMarkerImage('busy');
    const expandedMarker = getCongestionPinMarkerImage('busy', { isSelected: true });

    expect(defaultMarker.width).toBe(expandedMarker.width);
    expect(defaultMarker.height).toBe(expandedMarker.height);
    expect(defaultMarker.offset).toEqual(expandedMarker.offset);
  });

  it('지도 marker 높이를 텍스트 줄 수에 맞춰 늘린다', () => {
    const oneLineMarker = getCongestionPinMarkerImage('busy', {
      selectedMessage: '짧아요',
    });
    const twoLineMarker = getCongestionPinMarkerImage('busy', {
      selectedMessage: '첫 줄\n둘째 줄',
    });

    expect(twoLineMarker.height - oneLineMarker.height).toBe(15);
    expect(twoLineMarker.offset?.y).toBe(twoLineMarker.height);
  });

  it('지도에서 확장·축소 marker에 스토리북과 같은 CSS 애니메이션을 포함한다', () => {
    const expandedMarker = getCongestionPinMarkerImage('busy', {
      animation: 'expand',
      isSelected: true,
    });
    const collapsedMarker = getCongestionPinMarkerImage('busy', {
      animation: 'collapse',
      selectedMessage: '탑승 대기 인원이 많아요',
    });

    const expandedSvg = decodeURIComponent(expandedMarker.src.split(',')[1] ?? '');
    const collapsedSvg = decodeURIComponent(collapsedMarker.src.split(',')[1] ?? '');

    expect(expandedSvg).toContain('cubic-bezier(0.22,2.1,0.36,1)');
    expect(expandedSvg).toContain('150ms');
    expect(expandedSvg).toContain('scale(0.286,0.466)');
    expect(expandedSvg).toContain(
      '</g></g></g><g class="congestion-pin-text-expand"><text x="59.5" y="28"',
    );
    expect(expandedSvg).toContain('75ms');
    expect(collapsedSvg).toContain('cubic-bezier(0.22,2.1,0.36,1)');
    expect(collapsedSvg).toContain('150ms');
    expect(collapsedSvg).toContain('scale(0.286,0.466)');
    expect(collapsedSvg).toContain(
      '</g></g></g><g class="congestion-pin-text-collapse"><text x="59.5" y="28"',
    );
    expect(collapsedSvg).toContain('50ms');
    expect(collapsedSvg).toContain('ease-in 0ms');
  });

  it('반복 클릭에서도 매번 새 애니메이션 marker source를 만든다', () => {
    const firstMarker = getCongestionPinMarkerImage('busy', {
      animation: 'expand',
      animationKey: 1,
      isSelected: true,
    });
    const secondMarker = getCongestionPinMarkerImage('busy', {
      animation: 'expand',
      animationKey: 2,
      isSelected: true,
    });

    expect(firstMarker.src).not.toBe(secondMarker.src);
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
