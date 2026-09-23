import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

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
});

describe('TimeInputButton', () => {
  it('시간을 기본 표시 형식으로 렌더링한다', () => {
    render(<TimeInputButton value={{ period: '오후', hour: 6, minute: 40 }} />);

    expect(screen.getByRole('button', { name: '시간 선택' })).toHaveTextContent('오후 6:40');
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
