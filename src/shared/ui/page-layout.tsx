import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type PageLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PageLayout({ children, header, className, contentClassName }: PageLayoutProps) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[var(--color-bg-layer-default)]',
        className,
      )}
    >
      {header}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col px-5 pb-[calc(var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom))]',
          contentClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}
