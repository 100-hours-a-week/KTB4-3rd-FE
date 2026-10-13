import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  TransferConfirmationRecognitionFailedDialog,
  UnsettledSettlementDialog,
} from '@/features/taxi-pot-settlement';

afterEach(cleanup);

describe('TransferConfirmationRecognitionFailedDialog', () => {
  it('사진 재선택 안내를 표시하고 버튼 콜백을 호출한다', async () => {
    const onReselectPhoto = vi.fn<() => void>();
    render(<TransferConfirmationRecognitionFailedDialog onReselectPhoto={onReselectPhoto} open />);

    expect(screen.getByRole('dialog', { name: '사진 인식을 실패했어요' })).toBeInTheDocument();
    expect(screen.getByText('사진을 다시 선택해주세요')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다시 선택하기' }));
    expect(onReselectPhoto).toHaveBeenCalledOnce();
  });
});

describe('UnsettledSettlementDialog', () => {
  it('미진행 정산 안내를 표시하고 버튼 콜백을 호출한다', async () => {
    const onGoToSettlement = vi.fn<() => void>();
    render(<UnsettledSettlementDialog onGoToSettlement={onGoToSettlement} open />);

    expect(screen.getByRole('dialog', { name: '진행하지 않은 정산이 있어요' })).toBeInTheDocument();
    expect(screen.getByText('정산을 진행해주세요')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '정산 하러가기' }));
    expect(onGoToSettlement).toHaveBeenCalledOnce();
  });
});
