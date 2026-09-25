import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Radio } from '@/shared/ui/radio';

afterEach(cleanup);

describe('Radio', () => {
  it('피그마 기준 기본 크기와 라벨을 렌더링한다', () => {
    render(<Radio label="대중교통" />);

    const radio = screen.getByRole('radio', { name: '대중교통' });
    const mark = radio.nextElementSibling;

    expect(radio).not.toBeChecked();
    expect(radio).toHaveAttribute('type', 'radio');
    expect(mark).toHaveAttribute('data-size', 'medium');
    expect(mark).toHaveAttribute('data-selection-color', 'figma');
    expect(screen.getByText('대중교통').className).toMatch(/t4Regular/);
  });

  it('선택 상태를 변경하고 다음 값을 전달한다', () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(<Radio label="대중교통" onCheckedChange={onCheckedChange} />);

    const radio = screen.getByRole('radio', { name: '대중교통' });

    fireEvent.click(radio);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(radio).toBeChecked();
  });

  it('Large와 Bold 및 브랜드 선택 색상을 지원한다', () => {
    render(<Radio defaultChecked label="자차" selectionColor="brand" size="large" weight="bold" />);

    const radio = screen.getByRole('radio', { name: '자차' });
    const mark = radio.nextElementSibling;

    expect(radio).toBeChecked();
    expect(mark).toHaveAttribute('data-size', 'large');
    expect(mark).toHaveAttribute('data-selection-color', 'brand');
    expect(screen.getByText('자차').className).toMatch(/t5Bold/);
  });

  it('같은 name을 가진 라디오끼리 하나만 선택된다', () => {
    render(
      <>
        <Radio defaultChecked label="대중교통" name="transport" value="public" />
        <Radio label="자차" name="transport" value="car" />
      </>,
    );

    const publicTransport = screen.getByRole('radio', { name: '대중교통' });
    const car = screen.getByRole('radio', { name: '자차' });

    fireEvent.click(car);

    expect(publicTransport).not.toBeChecked();
    expect(car).toBeChecked();
  });

  it('비활성화 상태에서는 선택되지 않는다', () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();

    render(<Radio defaultChecked disabled label="대중교통" onCheckedChange={onCheckedChange} />);

    const radio = screen.getByRole('radio', { name: '대중교통' });

    expect(radio).toBeDisabled();
    expect(radio).toBeChecked();

    fireEvent.click(radio);

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
