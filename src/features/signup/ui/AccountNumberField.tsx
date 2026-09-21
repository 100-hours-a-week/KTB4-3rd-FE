import type { ReactNode } from 'react';

import { InputField } from '@/shared/ui/input-field';

export type AccountNumberFieldProps = {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: ReactNode | null;
  helperText?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export function AccountNumberField({
  disabled = false,
  errorMessage = null,
  helperText = null,
  invalid = false,
  onChange,
  required = false,
  value,
}: AccountNumberFieldProps) {
  return (
    <InputField
      aria-label="계좌번호"
      autoComplete="off"
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={helperText}
      id="account_no"
      inputMode="numeric"
      invalid={invalid}
      label="계좌번호"
      name="account_no"
      onValueChange={onChange}
      placeholder="계좌번호를 입력해주세요"
      required={required}
      value={value}
    />
  );
}
