import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { TaxiMeterAnalysisDialog, TaxiMeterAmountDialog } from '@/features/taxi-pot-settlement';

afterEach(cleanup);

describe('TaxiMeterAnalysisDialog', () => {
  it('분석 중 안내와 진행 표시를 렌더링한다', () => {
    render(<TaxiMeterAnalysisDialog open />);

    expect(screen.getByRole('dialog', { name: '이미지를 분석하고있어요' })).toBeInTheDocument();
    expect(screen.getByText(/동승자에게 금액이 청구돼요/)).toBeInTheDocument();
    expect(screen.getByRole('dialog').querySelector('img')).toHaveAttribute(
      'src',
      '/icons/taxi-meter-analysis-dots.svg',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('분석 지연 안내를 렌더링한다', () => {
    render(<TaxiMeterAnalysisDialog delayed open />);

    expect(screen.getByText(/AI 분석이 지연되고있어요/)).toBeInTheDocument();
    expect(screen.getByText(/잠시만 기다려주세요/)).toBeInTheDocument();
    expect(screen.getByRole('dialog').querySelector('img')).not.toBeInTheDocument();
  });
});

describe('TaxiMeterAmountDialog', () => {
  function ControlledAmountDialog({ recognitionFailed = false }: { recognitionFailed?: boolean }) {
    const [value, setValue] = useState('');

    return (
      <TaxiMeterAmountDialog
        onValueChange={setValue}
        open
        recognitionFailed={recognitionFailed}
        value={value}
      />
    );
  }

  it('직접 입력 모달에서 숫자만 입력받는다', async () => {
    const user = userEvent.setup();
    render(<ControlledAmountDialog />);

    const input = screen.getByRole('textbox', { name: '결제 금액' });
    expect(
      screen.getByRole('dialog', { name: '결제 금액을 직접 입력해주세요' }),
    ).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '금액을 입력해주세요');

    await user.type(input, '12a3');
    expect(input).toHaveValue('123');
  });

  it('사진 인식 실패 안내와 직접 입력 필드를 렌더링한다', () => {
    render(<ControlledAmountDialog recognitionFailed />);

    expect(screen.getByRole('dialog', { name: '사진 인식을 실패했어요' })).toBeInTheDocument();
    expect(screen.getByText('결제 금액을 직접 입력해주세요')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '결제 금액' })).toBeInTheDocument();
  });
});
