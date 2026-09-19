import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Divider } from '@/shared/ui/divider';

afterEach(cleanup);

describe('Divider', () => {
  it('기본값으로 의미 있는 수평 구분선을 렌더링한다', () => {
    render(<Divider />);

    const divider = screen.getByRole('separator');

    expect(divider.tagName).toBe('HR');
    expect(divider).toHaveClass('h-[var(--divider-thickness)]', 'w-full');
    expect(divider).toHaveStyle({
      '--divider-color': 'var(--color-stroke-neutral-muted)',
      '--divider-thickness': '1px',
    });
  });

  it('색상, 두께, inset을 적용한다', () => {
    render(<Divider color="neutral-subtle" thickness="2px" inset />);

    const divider = screen.getByRole('separator');

    expect(divider).toHaveClass('mx-[var(--spacing-x-global-gutter)]', 'w-auto');
    expect(divider).toHaveStyle({
      '--divider-color': 'var(--color-stroke-neutral-subtle)',
      '--divider-thickness': '2px',
    });
  });

  it('세로 방향과 다른 엘리먼트를 지원한다', () => {
    render(<Divider as="div" orientation="vertical" data-testid="divider" />);

    const divider = screen.getByTestId('divider');

    expect(divider).not.toHaveAttribute('role');
    expect(divider).toHaveAttribute('aria-orientation', 'vertical');
    expect(divider).toHaveClass('h-full', 'w-[var(--divider-thickness)]');
  });
});
