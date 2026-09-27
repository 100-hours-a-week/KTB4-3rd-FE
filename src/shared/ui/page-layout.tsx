import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type PageLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PageLayout({
  children,
  footer,
  header,
  className,
  contentClassName,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        'mx-auto flex h-dvh min-h-0 w-full max-w-[393px] flex-col overflow-hidden bg-[var(--color-bg-layer-default)]',
        className,
      )}
    >
      {header ? <div className="h-[var(--dimension-x14)] shrink-0">{header}</div> : null}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[calc(var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom))]',
          contentClassName,
        )}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
