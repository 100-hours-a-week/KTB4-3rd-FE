'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type PhotoInputProps = {
  /** Existing profile image URL to show before a new file is selected. */
  defaultPreviewUrl?: string | null;
  /** Called with the newly selected file. It receives null when the selection is cleared. */
  onFileChange?: (file: File | null) => void;
  /** File types shown by the native picker. */
  accept?: string;
  /** Accessible name for the picker button. */
  'aria-label'?: string;
  /** Alternative text for the selected image preview. */
  previewAlt?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
};

export function PhotoInput({
  accept = 'image/*',
  'aria-label': ariaLabel = '프로필 사진 선택',
  className,
  defaultPreviewUrl = null,
  disabled = false,
  id,
  name,
  onFileChange,
  previewAlt = '프로필 사진 미리보기',
  required = false,
}: PhotoInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const filePreviewUrlRef = useRef<string | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (filePreviewUrlRef.current) {
        URL.revokeObjectURL(filePreviewUrlRef.current);
      }
    };
  }, []);

  const previewUrl = filePreviewUrl ?? defaultPreviewUrl;

  function handleOpenPicker() {
    if (disabled || !inputRef.current) {
      return;
    }

    // Clear the native value so choosing the same file twice still emits a change event.
    inputRef.current.value = '';
    inputRef.current.click();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    if (file && !file.type.startsWith('image/')) {
      event.currentTarget.value = '';
      return;
    }

    if (filePreviewUrlRef.current) {
      URL.revokeObjectURL(filePreviewUrlRef.current);
    }

    const nextPreviewUrl =
      file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null;

    filePreviewUrlRef.current = nextPreviewUrl;
    setFilePreviewUrl(nextPreviewUrl);
    onFileChange?.(file);
  }

  return (
    <>
      <button
        aria-label={ariaLabel}
        className={cn(
          'relative inline-flex size-[100px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-brand-weak)] transition-opacity',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        data-node-id="853:21366"
        disabled={disabled}
        onClick={handleOpenPicker}
        type="button"
      >
        {previewUrl ? (
          <Image
            alt={previewAlt}
            className="object-cover"
            fill
            sizes="100px"
            src={previewUrl}
            unoptimized
          />
        ) : (
          <span data-node-id="853:21372">
            <Icon
              aria-hidden="true"
              color="var(--color-fg-brand-contrast)"
              name="camera"
              size={48}
            />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        accept={accept}
        aria-label={`${ariaLabel} 파일`}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        name={name}
        multiple={false}
        onChange={handleFileChange}
        required={required}
        type="file"
      />
    </>
  );
}
