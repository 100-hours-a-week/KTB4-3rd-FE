import { cleanup, render, screen } from '@testing-library/react';
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
    expect(screen.getByLabelText('택시 미터기 사진 선택')).toHaveAttribute('accept', 'image/*');
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

  it('reopens the picker for retake and keeps the preview if selection is cancelled', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const file = new File(['meter'], 'meter.png', { type: 'image/png' });

    render(<TaxiMeterPhotoRequest onSend={() => {}} />);
    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);
    await user.click(screen.getByRole('button', { name: '재촬영' }));

    expect(inputClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: '사진 확인' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '선택한 택시 미터기 사진' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '사진 확인 닫기' }));
    expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:meter-preview');
  });

  it('ignores non-image files', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });

    render(<TaxiMeterPhotoRequest onSend={() => {}} />);
    await user.upload(screen.getByLabelText('택시 미터기 사진 선택'), file);

    expect(screen.queryByRole('heading', { name: '사진 확인' })).not.toBeInTheDocument();
  });
});
