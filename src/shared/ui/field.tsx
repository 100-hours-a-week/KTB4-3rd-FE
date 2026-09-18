import { Field as BaseField } from '@base-ui/react/field';
import {
  cloneElement,
  forwardRef,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactElement,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';

export type FieldLabelWeight = 'medium' | 'bold';

export type FieldRequirementMark = 'required' | 'optional' | ReactNode;

type FieldOwnProps = {
  label: ReactNode;
  inputSlot: ReactNode;
  labelWeight?: FieldLabelWeight;
  required?: boolean;
  requirementMark?: FieldRequirementMark | null;
  suffixSlot?: ReactNode | null;
  helperText?: ReactNode | null;
  errorMessage?: ReactNode | null;
  characterCount?: ReactNode | null;
  maxCharacterCount?: ReactNode | null;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
};

type BaseFieldRootProps = Omit<
  ComponentPropsWithoutRef<typeof BaseField.Root>,
  'children' | 'className' | 'disabled' | 'invalid'
>;

export type FieldProps = BaseFieldRootProps & FieldOwnProps;

function hasContent(content: ReactNode | null | undefined) {
  return content !== null && content !== undefined && content !== false && content !== '';
}

function getRequirementMark(
  requirementMark: FieldRequirementMark | null | undefined,
  required: boolean,
) {
  let resolvedMark = requirementMark;

  if (resolvedMark === undefined) {
    resolvedMark = required ? 'required' : null;
  }

  if (!hasContent(resolvedMark)) {
    return null;
  }

  if (resolvedMark === 'required') {
    return (
      <span
        aria-hidden="true"
        className="pl-[var(--dimension-x1)] text-[16px] leading-[20px] font-normal text-[var(--color-fg-critical)]"
      >
        *
      </span>
    );
  }

  if (resolvedMark === 'optional') {
    return (
      <span
        aria-hidden="true"
        className="pl-[var(--dimension-x1)] leading-[var(--line-height-t3)] font-normal text-[var(--color-fg-neutral-subtle)] text-[var(--font-size-t3)]"
      >
        선택
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="pl-[var(--dimension-x1)]">
      {resolvedMark}
    </span>
  );
}

function getLabelClassName(labelWeight: FieldLabelWeight) {
  const weightClassName = labelWeight === 'bold' ? 'font-bold' : 'font-medium';

  return cn(
    'min-w-0 flex-1 text-[var(--font-size-t4)] leading-[var(--line-height-t4)] text-[var(--color-fg-neutral)] data-[disabled]:text-[var(--color-fg-disabled)]',
    weightClassName,
  );
}

function getCharacterCountInvalidState(
  characterCount: ReactNode | null | undefined,
  maxCharacterCount: ReactNode | null | undefined,
) {
  return (
    typeof characterCount === 'number' &&
    typeof maxCharacterCount === 'number' &&
    characterCount > maxCharacterCount
  );
}

function getCharacterCountClassName(isInvalid: boolean, hasCurrentCount: boolean) {
  if (isInvalid) {
    return 'text-[var(--color-fg-critical)]';
  }

  if (hasCurrentCount) {
    return 'text-[var(--color-fg-neutral)]';
  }

  return 'text-[var(--color-fg-neutral-subtle)]';
}

function renderFooterMessage(
  hasErrorMessage: boolean,
  errorMessage: ReactNode | null | undefined,
  helperContent: ReactNode | null | undefined,
) {
  if (hasErrorMessage) {
    return (
      <BaseField.Error
        className="flex items-center gap-[var(--dimension-x1)] leading-[var(--line-height-t3)] font-normal text-[var(--color-fg-critical)] text-[var(--font-size-t3)]"
        match
      >
        <Icon
          aria-hidden="true"
          color="var(--color-fg-critical)"
          name="exclamationmarkCircleFill"
          size={16}
        />
        <span className="min-w-0 break-words text-[var(--color-fg-critical)]">{errorMessage}</span>
      </BaseField.Error>
    );
  }

  if (hasContent(helperContent)) {
    return (
      <BaseField.Description className="leading-[var(--line-height-t3)] font-normal break-words text-[var(--color-fg-neutral-subtle)] text-[var(--font-size-t3)] data-[disabled]:text-[var(--color-fg-disabled)]">
        {helperContent}
      </BaseField.Description>
    );
  }

  return null;
}

function renderInputSlot(
  inputSlot: ReactNode,
  disabled: boolean,
  invalid: boolean,
  required: boolean,
) {
  if (!isValidElement(inputSlot)) {
    return inputSlot;
  }

  const slotProps = inputSlot.props as {
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
  };

  return cloneElement(
    inputSlot as ReactElement<{ disabled?: boolean; invalid?: boolean; required?: boolean }>,
    {
      disabled: disabled || slotProps.disabled,
      invalid: invalid || slotProps.invalid,
      required: required || slotProps.required,
    },
  );
}

export const Field = forwardRef<ComponentRef<typeof BaseField.Root>, FieldProps>(
  (
    {
      characterCount,
      className,
      disabled = false,
      errorMessage,
      helperText,
      inputSlot,
      invalid = false,
      label,
      labelWeight = 'bold',
      maxCharacterCount,
      required = false,
      requirementMark,
      suffixSlot,
      ...rootProps
    },
    ref,
  ) => {
    const helperContent = helperText;
    const hasErrorMessage = hasContent(errorMessage);
    const isInvalid = invalid || hasErrorMessage;
    const hasCharacterCount = hasContent(characterCount) || hasContent(maxCharacterCount);
    const hasFooter = hasContent(helperContent) || hasErrorMessage || hasCharacterCount;
    const isCharacterCountInvalid = getCharacterCountInvalidState(
      characterCount,
      maxCharacterCount,
    );

    return (
      <BaseField.Root
        {...rootProps}
        ref={ref}
        className={cn('flex w-full flex-col gap-[var(--dimension-x2)]', className)}
        disabled={disabled}
        invalid={isInvalid}
      >
        <div className="flex min-h-[20px] w-full items-center gap-[var(--dimension-x1)] px-[var(--dimension-x0_5)]">
          <BaseField.Label className={getLabelClassName(labelWeight)}>
            {label}
            {getRequirementMark(requirementMark, required)}
          </BaseField.Label>
          {hasContent(suffixSlot) ? (
            <span className="inline-flex shrink-0 items-center">{suffixSlot}</span>
          ) : null}
        </div>

        {renderInputSlot(inputSlot, disabled, isInvalid, required)}

        {hasFooter ? (
          <div className="flex min-h-[20px] w-full items-center justify-between gap-[var(--dimension-x2)] px-[var(--dimension-x0_5)]">
            <div className="min-w-0 flex-1">
              {renderFooterMessage(hasErrorMessage, errorMessage, helperContent)}
            </div>

            {hasCharacterCount ? (
              <span
                aria-label="글자 수"
                className={cn(
                  'shrink-0 text-[var(--font-size-t4)] leading-[var(--line-height-t4)] font-normal',
                  getCharacterCountClassName(isCharacterCountInvalid, hasContent(characterCount)),
                )}
              >
                {hasContent(characterCount) ? characterCount : 0}
                {hasContent(maxCharacterCount) ? <> / {maxCharacterCount}</> : null}
              </span>
            ) : null}
          </div>
        ) : null}
      </BaseField.Root>
    );
  },
);

Field.displayName = 'Field';
