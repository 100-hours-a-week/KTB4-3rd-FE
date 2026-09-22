'use client';

import { useId, useState, type FormEvent } from 'react';

import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

export type CommentComposerProps = {
  className?: string;
  disabled?: boolean;
  onSubmit?: (content: string) => void;
  placeholder?: string;
};

export function CommentComposer({
  className,
  disabled = false,
  onSubmit,
  placeholder = '댓글을 입력해 주세요',
}: CommentComposerProps) {
  const inputId = useId();
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length > 0 && !disabled;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = value.trim();
    if (!content || disabled) {
      return;
    }

    onSubmit?.(content);
    setValue('');
  };

  return (
    <form className={cn('px-6 py-3', className)} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        댓글 입력
      </label>
      <div className="relative flex items-center">
        <input
          aria-label="댓글 입력"
          className="h-11 w-full rounded-full border-0 bg-[var(--color-bg-neutral-weak)] py-3 pr-12 pl-4 !text-[length:var(--font-size-t4)] !leading-[var(--line-height-t4)] !font-[var(--font-weight-regular)] text-[var(--color-fg-neutral)] outline-none placeholder:text-[var(--color-fg-neutral-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          id={inputId}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <button
          aria-label="댓글 전송"
          className="absolute right-1 inline-flex size-[34px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </form>
  );
}
