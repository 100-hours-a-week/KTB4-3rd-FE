'use client';

import { cn } from '@/shared/lib/cn';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import { Snackbar } from './snackbar';

type SnackbarViewportProps = {
  className?: string;
};

export function SnackbarViewport({ className }: SnackbarViewportProps) {
  const { closeSnackbar, description, open, type } = useSnackbarStore();

  return (
    <Snackbar
      className={cn('pointer-events-auto z-[2147483647]', className)}
      description={description}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeSnackbar();
        }
      }}
      open={open}
      timeout={type === 'positive' ? 3000 : undefined}
      type={type}
    />
  );
}
