import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Icon } from '@/shared/ui/icon';

describe('Icon', () => {
  it('요청한 크기와 색상으로 아이콘을 렌더링한다', () => {
    const { container } = render(<Icon name="camera" size={32} color="#ff0000" />);
    const icon = container.querySelector('span');

    expect(icon).toHaveStyle({
      width: '32px',
      height: '32px',
      backgroundColor: 'rgb(255, 0, 0)',
    });
    expect(icon?.style.maskImage).toContain('/icons/seed/icon_camera_line.svg');
  });

  it('문서 아이콘 asset을 렌더링한다', () => {
    const { container } = render(<Icon name="document" />);
    const icon = container.querySelector('span');

    expect(icon?.style.maskImage).toContain('/icons/seed/icon_document_fill.svg');
  });

  it('텍스트 말풍선 아이콘 asset을 렌더링한다', () => {
    const { container } = render(<Icon name="chatbubbleText" />);
    const icon = container.querySelector('span');

    expect(icon?.style.maskImage).toContain('/icons/seed/icon_chatbubble_text_fill.svg');
  });

  it('접근성 라벨이 있는 아이콘을 렌더링한다', () => {
    const { getByRole } = render(<Icon name="info" title="정보" />);

    expect(getByRole('img', { name: '정보' })).toBeInTheDocument();
  });

  it('CalendarDays, Clock3, Search Lucide 아이콘을 렌더링한다', () => {
    const { getByRole } = render(
      <>
        <Icon name="calendarDays" title="날짜" />
        <Icon name="clock3" title="시간" />
        <Icon name="search" title="검색" />
      </>,
    );

    expect(getByRole('img', { name: '날짜' })).toBeInTheDocument();
    expect(getByRole('img', { name: '시간' })).toBeInTheDocument();
    expect(getByRole('img', { name: '검색' })).toBeInTheDocument();
  });

  it('장식용 아이콘은 기본적으로 보조 기술에서 숨긴다', () => {
    const { container } = render(<Icon name="chevronRight" />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
