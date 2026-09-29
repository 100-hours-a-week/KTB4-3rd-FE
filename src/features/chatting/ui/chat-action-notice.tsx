import { Button, type ButtonProps } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';
import { cn } from '@/shared/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

export type ChatActionNoticeActionProps = Omit<
  ButtonProps,
  'children' | 'size' | 'variant' | 'width'
>;

export type ChatActionNoticeProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children: ReactNode;
  actionLabel: ReactNode;
  actionProps?: ChatActionNoticeActionProps;
};

export function ChatActionNotice({
  actionLabel,
  actionProps,
  children,
  className,
  ...props
}: ChatActionNoticeProps) {
  return (
    <div
      {...props}
      className={cn(
        'flex w-[240px] max-w-full flex-col gap-4 rounded-[12px] bg-[var(--color-bg-brand-weak)] p-4',
        className,
      )}
      data-component="chat-action-notice"
    >
      <Text as="p" className="m-0 break-words" color="fg.neutral" variant="t5Bold">
        {children}
      </Text>
      <div className="-mx-1 w-[calc(100%+8px)]">
        <Button
          {...actionProps}
          className={cn('h-[44px] !rounded-[10px]', actionProps?.className)}
          size="medium"
          variant="brand-solid"
          width="fill"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
