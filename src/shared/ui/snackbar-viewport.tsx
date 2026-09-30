'use client';

import { Toast } from '@base-ui/react/toast';

import { cn } from '@/shared/lib/cn';

import { SnackbarToast } from './snackbar';

type SnackbarViewportProps = {
  className?: string;
};

export function SnackbarViewport({ className }: SnackbarViewportProps) {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className={cn('pointer-events-none z-[2147483647]', className)}>
        {toasts.map((toast) => (
          <SnackbarToast key={toast.id} toast={toast} />
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
