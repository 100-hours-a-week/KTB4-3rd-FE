'use client';

import { useState, type FormEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';

const DEFAULT_PLACEHOLDER = '메시지를 입력하세요.';

export type ChatComposerProps = {
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  onSubmit?: (message: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
};

export function ChatComposer({
  className,
  defaultValue = '',
  disabled = false,
  onSubmit,
  onValueChange,
  placeholder = DEFAULT_PLACEHOLDER,
  value,
}: ChatComposerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const canSubmit = currentValue.trim().length > 0 && !disabled;

  const handleValueChange = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = currentValue.trim();
    if (!message || disabled) {
      return;
    }

    onSubmit?.(message);

    if (!isControlled) {
      setInternalValue('');
    }
  };

  return (
    <form
      className={cn('relative h-[78px] w-full bg-[var(--color-bg-layer-default)]', className)}
      onSubmit={handleSubmit}
    >
      <div className="absolute top-[13px] right-[18px] left-[22px]">
        <Input
          aria-label="메시지 입력"
          disabled={disabled}
          disableFocusBorder
          inputClassName="!text-[length:var(--font-size-t5)] !leading-[var(--line-height-t5)] !font-[var(--font-weight-regular)] placeholder:!text-[var(--color-fg-neutral-muted)]"
          onValueChange={handleValueChange}
          placeholder={placeholder}
          value={currentValue}
        />
      </div>
      <button
        aria-label="메시지 전송"
        className="absolute top-[17px] right-[20px] inline-flex size-[44px] items-center justify-center rounded-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed"
        disabled={!canSubmit}
        type="submit"
      >
        <Icon
          aria-hidden="true"
          color={canSubmit ? 'var(--color-fg-brand)' : 'var(--color-fg-neutral-muted)'}
          name="chattingSend"
          size={24}
        />
      </button>
    </form>
  );
}
