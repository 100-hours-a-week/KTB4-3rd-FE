import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResultSection } from '@/shared/ui/result-section';

afterEach(cleanup);

describe('ResultSection', () => {
  it('기본 결과 안내 콘텐츠를 렌더링한다', () => {
    render(<ResultSection />);

    expect(screen.getByRole('heading', { level: 2, name: '상태 안내 타이틀' })).toBeInTheDocument();
    expect(
      screen.getByText(/상태에 대한 부가 설명이 필요한 경우 적어주세요\./),
    ).toBeInTheDocument();
    expect(screen.getByTestId('result-section-icon')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('크기를 반영하고 정적 아이콘을 렌더링한다', () => {
    render(<ResultSection size="medium" />);

    const section = screen.getByRole('heading').closest('section');

    expect(section).toHaveClass('h-[350px]');
    expect(screen.getByTestId('result-section-icon')).toBeInTheDocument();
  });

  it('사용처에서 전달한 아이콘으로 교체할 수 있다', () => {
    render(<ResultSection icon={<span data-testid="custom-result-icon" />} />);

    expect(screen.getByTestId('result-section-icon')).toContainElement(
      screen.getByTestId('custom-result-icon'),
    );
  });

  it('아이콘과 타이틀 사이 28px, 타이틀과 description 사이 8px 간격을 둔다', () => {
    render(<ResultSection />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('!mt-[22px]');
    expect(screen.getByText(/상태에 대한 부가 설명이 필요한 경우 적어주세요\./)).toHaveClass(
      '!mt-[8px]',
    );
  });

  it('단일 Primary 버튼을 고정 폭 슬롯 안에 중앙 배치한다', () => {
    render(<ResultSection buttons="primary" />);

    const button = screen.getByRole('button', { name: '라벨' });

    expect(button.parentElement).toHaveClass('w-[104px]');
    expect(button.parentElement?.parentElement).toHaveClass('w-[104px]');
  });

  it('description과 버튼 사이에 12px 간격을 둔다', () => {
    render(<ResultSection buttons="primary" />);

    const button = screen.getByRole('button', { name: '라벨' });

    expect(button.parentElement?.parentElement).toHaveClass('mt-[12px]');
  });

  it('단일 Primary 버튼은 기본 배경과 눌림 배경을 구분한다', () => {
    render(<ResultSection buttons="primary" />);

    expect(screen.getByRole('button', { name: '라벨' })).toHaveClass(
      'bg-[var(--color-bg-transparent-selected)]',
      'active:!bg-[var(--color-bg-transparent-selected-pressed)]',
    );
  });

  it('단일 액션과 보조 액션을 렌더링하고 콜백을 전달한다', async () => {
    const user = userEvent.setup();
    const onPrimaryClick = vi.fn<() => void>();
    const onSecondaryClick = vi.fn<() => void>();

    render(
      <ResultSection
        buttons="primarySecondary"
        primaryButtonProps={{ onClick: onPrimaryClick }}
        primaryLabel="확인"
        secondaryButtonProps={{ onClick: onSecondaryClick }}
        secondaryLabel="취소"
      />,
    );

    await user.click(screen.getByRole('button', { name: '확인' }));
    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(onPrimaryClick).toHaveBeenCalledOnce();
    expect(onSecondaryClick).toHaveBeenCalledOnce();
  });
});
