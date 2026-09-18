import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox } from '@/shared/ui/checkbox';

afterEach(cleanup);

describe('Checkbox', () => {
  it('피그마 기준 크기와 기본 요구사항을 렌더링한다', () => {
    render(<Checkbox label="서비스 이용약관 동의" />);

    const checkbox = screen.getByRole('checkbox', { name: '서비스 이용약관 동의' });
    const row = checkbox.parentElement;

    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveAttribute('aria-required', 'true');
    expect(row).toHaveTextContent('(필수)');
    expect(checkbox).toHaveClass('size-[24px]');
  });

  it('선택 상태를 변경하고 다음 값을 전달한다', () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(<Checkbox label="서비스 이용약관 동의" onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox', { name: '서비스 이용약관 동의' });

    fireEvent.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('선택사항과 굵은 라벨을 지원한다', () => {
    render(<Checkbox label="마케팅 수신 동의" requirement="optional" weight="bold" />);

    const checkbox = screen.getByRole('checkbox', { name: '마케팅 수신 동의' });
    const row = checkbox.parentElement;

    expect(checkbox).not.toHaveAttribute('aria-required');
    expect(row).toHaveTextContent('(선택)');
    expect(screen.getByText('마케팅 수신 동의').className).toMatch(/t5Bold/);
  });

  it('비활성화 상태에서는 선택되지 않는다', () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(
      <Checkbox
        defaultChecked
        disabled
        label="서비스 이용약관 동의"
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: '서비스 이용약관 동의' });

    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(checkbox);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
