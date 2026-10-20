import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaxiMeterPhotoRequest } from '@/features/taxi-pot-settlement';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('TaxiMeterPhotoRequest', () => {
  beforeEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: vi.fn<(file: Blob) => string>(() => 'blob:meter-preview'),
      },
      revokeObjectURL: {
        configurable: true,
        value: vi.fn<(url: string) => void>(),
      },
    });
  });

  it('opens the native image picker and shows a confirmation screen after selection', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn<(file: File) => void>();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const file = new File(['meter'], 'meter.png', { type: 'image/png' });

    render(<TaxiMeterPhotoRequest onSend={onSend} />);

    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(inputClick).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('택시 미터기 사진 선택')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png',
    );
    expect(screen.getByLabelText('택시 미터기 사진 선택')).not.toHaveAttribute('capture');

    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    expect(screen.getByRole('heading', { name: '사진 확인' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toHaveAttribute(
      'src',
      'blob:meter-preview',
    );

    await user.click(screen.getByRole('button', { name: '전송' }));
    expect(onSend).toHaveBeenCalledWith(file);
  });

  it('closes the confirmation screen when settlement analysis is finished', async () => {
    const user = userEvent.setup();
    const file = new File(['meter'], 'meter.png', { type: 'image/png' });
    const { rerender } = render(<TaxiMeterPhotoRequest key="initial" onSend={() => {}} />);

    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    expect(screen.getByRole('heading', { name: '사진 확인' })).toBeInTheDocument();

    rerender(<TaxiMeterPhotoRequest key="reset" onSend={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
    });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:meter-preview');
  });

  it('keeps the photo when exit confirmation is cancelled or dismissed', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const file = new File(['meter'], 'meter.png', { type: 'image/png' });

    render(<TaxiMeterPhotoRequest onSend={() => {}} />);
    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    await user.click(screen.getByRole('button', { name: '사진 확인 닫기' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('정말 나가시겠어요?');
    expect(inputClick).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '재촬영' }));
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '재촬영' }));
    await user.click(screen.getByTestId('dialog-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 확인 닫기' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toBeInTheDocument();

    expect(inputClick).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it('discards the photo only after confirming back or retake', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const file = new File(['meter'], 'meter.png', { type: 'image/png' });

    render(<TaxiMeterPhotoRequest onSend={() => {}} />);
    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    await user.click(screen.getByRole('button', { name: '재촬영' }));

    expect(inputClick).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '나갈게요' }));

    expect(inputClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:meter-preview');

    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    await user.click(screen.getByRole('button', { name: '사진 확인 닫기' }));
    await user.click(screen.getByRole('button', { name: '나갈게요' }));
    expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
    expect(inputClick).toHaveBeenCalledOnce();
  });

  it('ignores non-image files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });

    render(<TaxiMeterPhotoRequest onSend={() => {}} />);
    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);

    expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
  });
});
