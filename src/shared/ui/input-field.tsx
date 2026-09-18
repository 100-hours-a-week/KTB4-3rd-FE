import { forwardRef, type ComponentRef, type ReactNode } from 'react';

import { Field, type FieldLabelWeight, type FieldRequirementMark } from './field';
import { Input, type InputProps } from './input';

export type InputFieldProps = Omit<InputProps, 'className'> & {
  label: ReactNode;
  labelWeight?: FieldLabelWeight;
  requirementMark?: FieldRequirementMark | null;
  suffixSlot?: ReactNode | null;
  helperText?: ReactNode | null;
  errorMessage?: ReactNode | null;
  characterCount?: ReactNode | null;
  maxCharacterCount?: ReactNode | null;
  className?: string;
};

function hasContent(content: ReactNode | null | undefined) {
  return content !== null && content !== undefined && content !== false && content !== '';
}

export const InputField = forwardRef<ComponentRef<typeof Input>, InputFieldProps>(
  (
    {
      characterCount,
      className,
      disabled = false,
      errorMessage,
      helperText,
      inputClassName,
      invalid = false,
      label,
      labelWeight,
      maxCharacterCount,
      required = false,
      requirementMark,
      suffixSlot,
      ...inputProps
    },
    ref,
  ) => {
    const isInvalid = invalid || hasContent(errorMessage);

    return (
      <Field
        className={className}
        disabled={disabled}
        errorMessage={errorMessage}
        helperText={helperText}
        inputSlot={
          <Input
            {...inputProps}
            disabled={disabled}
            ref={ref}
            inputClassName={inputClassName}
            invalid={isInvalid}
            required={required}
          />
        }
        invalid={isInvalid}
        label={label}
        labelWeight={labelWeight}
        maxCharacterCount={maxCharacterCount}
        required={required}
        requirementMark={requirementMark}
        suffixSlot={suffixSlot}
        characterCount={characterCount}
      />
    );
  },
);

InputField.displayName = 'InputField';
