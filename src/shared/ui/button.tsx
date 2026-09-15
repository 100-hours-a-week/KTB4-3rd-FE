import { Button as BaseButton } from '@base-ui/react/button';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, 'className'> & {
  variant?: ButtonVariant;
  className?: string;
};

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700',
  secondary: 'bg-sky-100 text-sky-950 hover:bg-sky-200',
  ghost: 'text-slate-700 hover:bg-slate-100',
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-50',
        variantClassNames[variant],
        className,
      )}
      {...props}
    />
  );
}
