import type { ReactNode } from 'react';

import { InputField } from '@/shared/ui/input-field';

const MAX_NICKNAME_LENGTH = 20;

export type NicknameFieldProps = {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: ReactNode | null;
  helperText?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export function NicknameField({
  disabled = false,
  errorMessage = null,
  helperText = null,
  invalid = false,
  onChange,
  required = true,
  value,
}: NicknameFieldProps) {
  return (
    <InputField
      aria-label="닉네임"
      autoComplete="nickname"
      characterCount={value.length}
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={helperText}
      id="nickname"
      invalid={invalid}
      label="닉네임"
      maxCharacterCount={MAX_NICKNAME_LENGTH}
      maxLength={MAX_NICKNAME_LENGTH}
      name="nickname"
      onValueChange={onChange}
      placeholder="닉네임을 입력해주세요"
      required={required}
      value={value}
    />
  );
}
