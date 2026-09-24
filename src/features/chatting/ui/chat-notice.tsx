import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type ChatNoticeVariant = 'system' | 'informative';

export type ChatNoticeProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode;
  variant?: ChatNoticeVariant;
};

const variantClassNames: Record<ChatNoticeVariant, string> = {
  system:
    'bg-[var(--color-bg-neutral-weak)] text-[var(--color-fg-neutral-muted)] leading-[20px] font-normal',
  informative:
    'bg-[var(--color-bg-informative-weak)] text-[var(--color-fg-informative)] leading-[var(--line-height-t4)] font-bold',
};

export function ChatNotice({ children, className, variant = 'system', ...props }: ChatNoticeProps) {
  return (
    <div
      {...props}
      className={cn(
        'inline-flex w-fit max-w-full items-center rounded-full px-3 py-1 text-[length:var(--font-size-t4)]',
        variantClassNames[variant],
        className,
      )}
      data-variant={variant}
    >
      {children}
    </div>
  );
}
