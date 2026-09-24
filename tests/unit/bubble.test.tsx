import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Bubble } from '@/features/chatting';

afterEach(cleanup);

describe('Bubble', () => {
  it.each([
    ['system', 'bg-[var(--color-bg-brand-weak)]', 'color:var(--color-fg-neutral)'],
    ['me', 'bg-[var(--color-bg-brand-solid)]', 'color:var(--color-fg-neutral-inverted)'],
    ['other', 'bg-[var(--color-bg-neutral-weak)]', 'color:var(--color-fg-neutral)'],
  ] as const)('각 variant의 색상과 콘텐츠를 렌더링한다', (variant, backgroundClass, color) => {
    render(<Bubble variant={variant}>메시지</Bubble>);

    const bubble = screen.getByText('메시지').parentElement;

    expect(bubble).toHaveAttribute('data-variant', variant);
    expect(bubble).toHaveClass(backgroundClass, 'max-w-[301px]', 'px-4', 'py-3');
    expect(bubble).toHaveClass(`text-[${color}]`);
  });

  it('시스템 로딩 상태에서만 상태 역할과 로딩 점을 렌더링한다', () => {
    const { rerender } = render(
      <Bubble loading variant="system">
        메시지를 준비하고 있어요
      </Bubble>,
    );

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    const loadingArea = screen.getByRole('status').querySelector('[aria-hidden="true"]');

    expect(loadingArea).toHaveClass('ml-3');
    expect(loadingArea?.querySelectorAll('span')).toHaveLength(3);

    rerender(
      <Bubble loading variant="me">
        메시지
      </Bubble>,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('메시지')).toBeInTheDocument();
  });

  it('고정 높이를 지정하지 않고 콘텐츠에 맞게 확장된다', () => {
    render(
      <Bubble>
        <p>첫 번째 줄</p>
        <p>두 번째 줄</p>
      </Bubble>,
    );

    const bubble = screen.getByText('첫 번째 줄').parentElement?.parentElement;

    expect(bubble).not.toHaveClass('h-full', 'h-[46px]', 'h-[74px]');
    expect(bubble).toHaveClass('w-fit', 'max-w-[301px]');
  });
});
