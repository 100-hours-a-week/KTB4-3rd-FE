import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CongestionToggle, type CongestionToggleProps } from '@/features/congestion';

afterEach(cleanup);

describe('CongestionToggle', () => {
  it('기본 상태로 혼잡도를 선택한다', () => {
    render(<CongestionToggle />);

    expect(screen.getByRole('button', { name: '혼잡도' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '커뮤니티' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('버튼을 클릭하면 선택 상태를 전환한다', () => {
    render(<CongestionToggle />);

    fireEvent.click(screen.getByRole('button', { name: '커뮤니티' }));

    expect(screen.getByRole('button', { name: '혼잡도' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '커뮤니티' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('제어 상태에서는 변경 값을 전달한다', () => {
    const onValueChange = vi.fn<NonNullable<CongestionToggleProps['onValueChange']>>();

    render(<CongestionToggle onValueChange={onValueChange} value="congestion" />);

    fireEvent.click(screen.getByRole('button', { name: '커뮤니티' }));

    expect(onValueChange).toHaveBeenCalledWith('community');
    expect(screen.getByRole('button', { name: '혼잡도' })).toHaveAttribute('aria-pressed', 'true');
  });
});
