import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Text } from './text';

export type HeaderProps = {
  title?: ReactNode;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

function hasRenderableContent(content: ReactNode | undefined) {
  return content !== undefined && content !== null && content !== false && content !== '';
}

export function Header({ title, leftSlot, rightSlot, className }: HeaderProps) {
  const hasTitle = hasRenderableContent(title);
  const hasLeftSlot = hasRenderableContent(leftSlot);

  if (!hasTitle && !hasLeftSlot) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[Header] title 또는 leftSlot을 전달해야 합니다.');
    }

    return null;
  }

  return (
    <header
      className={cn('sticky top-0 z-10 w-full bg-[var(--color-bg-layer-default)]', className)}
    >
      <div className="grid h-[var(--dimension-x14)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-[var(--dimension-x1_5)]">
        <div className="flex min-h-[44px] min-w-[44px] items-center justify-start">{leftSlot}</div>

        <div className="flex max-w-full min-w-0 items-center justify-center">
          {hasTitle ? (
            <Text
              as="h1"
              className="max-w-[calc(100vw-160px)] truncate"
              variant="t6Bold"
              color="fg.neutral"
              whiteSpace="nowrap"
            >
              {title}
            </Text>
          ) : null}
        </div>

        <div className="flex min-h-[44px] min-w-[44px] items-center justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
