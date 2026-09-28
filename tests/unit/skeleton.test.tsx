import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@/shared/ui/skeleton';

describe('Skeleton', () => {
  it('좌우로 흐르는 shimmer 애니메이션과 중립 배경을 적용한다', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveClass(
      'skeleton-shimmer',
      'bg-[var(--color-bg-neutral-weak)]',
    );
    expect(screen.getByTestId('skeleton')).not.toHaveClass('animate-pulse');
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
  });
});
