import type { ReactNode } from 'react';

import { GENDER_OPTIONS, type GenderCode } from '@/features/signup/model/gender';
import { Field } from '@/shared/ui/field';
import { Select } from '@/shared/ui/select';

export type GenderSelectFieldProps = {
  value: GenderCode | null;
  onChange: (value: GenderCode | null) => void;
  errorMessage?: ReactNode | null;
  helperText?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
};

export function GenderSelectField({
  disabled = false,
  errorMessage = null,
  helperText = null,
  invalid = false,
  onChange,
  required = true,
  value,
}: GenderSelectFieldProps) {
  return (
    <Field
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={helperText}
      inputSlot={
        <Select<GenderCode>
          aria-label="성별"
          disabled={disabled}
          id="gender"
          invalid={invalid}
          name="gender"
          onValueChange={onChange}
          options={GENDER_OPTIONS}
          placeholder="성별을 선택해주세요"
          required={required}
          value={value}
        />
      }
      invalid={invalid}
      label="성별"
      required={required}
    />
  );
}
