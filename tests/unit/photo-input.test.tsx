import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PhotoInput } from '@/shared/ui/photo-input';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('PhotoInput', () => {
  beforeEach(() => {
    Object.defineProperties(URL, {
      createObjectURL: {
        configurable: true,
        value: vi.fn<(file: Blob) => string>(() => 'blob:profile-preview'),
      },
      revokeObjectURL: {
        configurable: true,
        value: vi.fn<(url: string) => void>(),
      },
    });
  });

  it('renders the Figma fallback state and opens the native picker when clicked', async () => {
    const user = userEvent.setup();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');

    render(<PhotoInput />);

    expect(screen.getByRole('button', { name: '프로필 사진 선택' })).toHaveClass(
      'size-[100px]',
      'rounded-full',
      'bg-[var(--color-bg-brand-weak)]',
    );
    expect(screen.getByLabelText('프로필 사진 선택 파일')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '프로필 사진 선택' }));

    expect(inputClick).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('프로필 사진 선택 파일')).toHaveAttribute('accept', 'image/*');
    expect(screen.getByLabelText('프로필 사진 선택 파일')).not.toHaveAttribute('multiple');
  });

  it('shows the selected image preview and reports one file', async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn<(file: File | null) => void>();
    const file = new File(['profile'], 'profile.png', { type: 'image/png' });

    render(<PhotoInput onFileChange={onFileChange} />);

    await user.upload(screen.getByLabelText('프로필 사진 선택 파일'), file);

    expect(onFileChange).toHaveBeenCalledWith(file);
    expect(screen.getByRole('img', { name: '프로필 사진 미리보기' })).toHaveAttribute(
      'src',
      'blob:profile-preview',
    );
  });

  it('renders an existing image URL as the initial preview', () => {
    render(<PhotoInput defaultPreviewUrl="/images/profile.png" />);

    expect(screen.getByRole('img', { name: '프로필 사진 미리보기' })).toHaveAttribute(
      'src',
      '/images/profile.png',
    );
  });

  it('does not select non-image files', async () => {
    const user = userEvent.setup();
    const onFileChange = vi.fn<(file: File | null) => void>();
    const file = new File(['not an image'], 'profile.txt', { type: 'text/plain' });

    render(<PhotoInput onFileChange={onFileChange} />);

    await user.upload(screen.getByLabelText('프로필 사진 선택 파일'), file);

    expect(onFileChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: '프로필 사진 미리보기' })).not.toBeInTheDocument();
  });
});
