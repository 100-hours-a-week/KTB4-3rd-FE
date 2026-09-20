import type { ReactNode } from 'react';

import { Field } from '@/shared/ui/field';
import { Select } from '@/shared/ui/select';
import { BANK_OPTIONS, type BankCode } from '@/features/signup/model/bank';

export type BankSelectFieldProps = {
  value: BankCode | null;
  onChange: (value: BankCode | null) => void;
  errorMessage?: ReactNode | null;
  helperText?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export function BankSelectField({
  disabled = false,
  errorMessage = null,
  helperText = null,
  invalid = false,
  onChange,
  required = false,
  value,
}: BankSelectFieldProps) {
  return (
    <Field
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={helperText}
      inputSlot={
        <Select<BankCode>
          aria-label="출금 은행"
          disabled={disabled}
          id="bank"
          invalid={invalid}
          name="bank"
          onValueChange={onChange}
          options={BANK_OPTIONS}
          placeholder="은행을 선택해주세요"
          required={required}
          value={value}
        />
      }
      invalid={invalid}
      label="출금 은행"
      required={required}
    />
  );
}
