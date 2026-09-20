'use client';

import { useEffect, useMemo, type ComponentProps, type ReactNode } from 'react';

import { PhotoInput } from '@/shared/ui/photo-input';
import { Field } from '@/shared/ui/field';

export type ProfileImageFieldProps = {
  value: File | null;
  onChange: (value: File | null) => void;
  errorMessage?: ReactNode | null;
  helperText?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

type CenteredPhotoInputProps = ComponentProps<typeof PhotoInput> & {
  invalid?: boolean;
};

function CenteredPhotoInput({ invalid, ...props }: CenteredPhotoInputProps) {
  return (
    <div className="flex justify-center" data-invalid={invalid ? 'true' : undefined}>
      <PhotoInput {...props} />
    </div>
  );
}

export function ProfileImageField({
  disabled = false,
  errorMessage = null,
  helperText = null,
  invalid = false,
  onChange,
  required = true,
  value,
}: ProfileImageFieldProps) {
  const defaultPreviewUrl = useMemo(() => {
    if (!value || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return null;
    }

    return URL.createObjectURL(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (defaultPreviewUrl) {
        URL.revokeObjectURL(defaultPreviewUrl);
      }
    };
  }, [defaultPreviewUrl]);

  return (
    <Field
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={helperText}
      inputSlot={
        <CenteredPhotoInput
          aria-label="프로필 이미지 선택"
          defaultPreviewUrl={defaultPreviewUrl}
          disabled={disabled}
          id="profile-image"
          name="profileImage"
          onFileChange={onChange}
          required={required}
        />
      }
      invalid={invalid}
      label="프로필 이미지"
      required={required}
    />
  );
}
