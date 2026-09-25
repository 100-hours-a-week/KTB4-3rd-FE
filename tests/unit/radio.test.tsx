import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Radio, RadioGroup, type RadioGroupProps } from '@/shared/ui/radio';

afterEach(cleanup);

describe('Radio', () => {
  it('피그마 기준 기본 크기와 라벨을 렌더링한다', () => {
    render(
      <RadioGroup>
        <Radio label="대중교통" value="public" />
      </RadioGroup>,
    );

    const radio = screen.getByRole('radio', { name: '대중교통' });

    expect(radio).toHaveAttribute('data-unchecked', '');
    expect(radio).toHaveAttribute('data-size', 'medium');
    expect(radio).toHaveAttribute('data-selection-color', 'figma');
    expect(screen.getByText('대중교통').className).toMatch(/t4Regular/);
  });

  it('Base UI RadioGroup을 통해 선택 상태와 변경 값을 전달한다', () => {
    const onValueChange = vi.fn<NonNullable<RadioGroupProps['onValueChange']>>();

    render(
      <RadioGroup onValueChange={onValueChange}>
        <Radio label="대중교통" value="public" />
      </RadioGroup>,
    );

    const radio = screen.getByRole('radio', { name: '대중교통' });

    fireEvent.click(radio);

    expect(onValueChange).toHaveBeenCalledWith('public', expect.any(Object));
    expect(radio).toHaveAttribute('data-checked', '');
  });

  it('Large와 Bold 및 브랜드 선택 색상을 지원한다', () => {
    render(
      <RadioGroup defaultValue="car">
        <Radio label="자차" selectionColor="brand" size="large" value="car" weight="bold" />
      </RadioGroup>,
    );

    const radio = screen.getByRole('radio', { name: '자차' });

    expect(radio).toHaveAttribute('data-checked', '');
    expect(radio).toHaveAttribute('data-size', 'large');
    expect(radio).toHaveAttribute('data-selection-color', 'brand');
    expect(screen.getByText('자차').className).toMatch(/t5Bold/);
  });

  it('같은 RadioGroup 안에서 하나만 선택된다', () => {
    render(
      <RadioGroup defaultValue="public" name="transport">
        <Radio label="대중교통" value="public" />
        <Radio label="자차" value="car" />
      </RadioGroup>,
    );

    const publicTransport = screen.getByRole('radio', { name: '대중교통' });
    const car = screen.getByRole('radio', { name: '자차' });

    fireEvent.click(car);

    expect(publicTransport).toHaveAttribute('data-unchecked', '');
    expect(car).toHaveAttribute('data-checked', '');
  });

  it('비활성화 상태에서는 선택되지 않는다', () => {
    render(
      <RadioGroup defaultValue="public">
        <Radio disabled label="대중교통" value="public" />
      </RadioGroup>,
    );

    const radio = screen.getByRole('radio', { name: '대중교통' });

    expect(radio).toHaveAttribute('aria-disabled', 'true');
    expect(radio).toHaveAttribute('data-checked', '');

    fireEvent.click(radio);

    expect(radio).toHaveAttribute('data-checked', '');
  });
});
