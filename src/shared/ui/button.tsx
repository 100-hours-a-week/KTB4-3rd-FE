import { Button as BaseButton } from '@base-ui/react/button';
import { LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Text, type TextVariant } from './text';

export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export type ButtonVariant =
  | 'neutral-solid'
  | 'brand-solid'
  | 'neutral-weak'
  | 'brand-outline'
  | 'neutral-outline'
  | 'critical-solid'
  | 'ghost';

export type ButtonWidth = 'hug' | 'fill';

type ButtonOwnProps = {
  size?: ButtonSize;
  variant?: ButtonVariant;
  width?: ButtonWidth;
  loading?: boolean;
  prefixIcon?: ReactNode | null;
  suffixIcon?: ReactNode | null;
  textVariant?: TextVariant;
  className?: string;
};

export type ButtonProps = Omit<ComponentPropsWithoutRef<typeof BaseButton>, keyof ButtonOwnProps> &
  ButtonOwnProps;

type ButtonVariantStyle = {
  enabled: string;
  loading: string;
  disabled: string;
};

const sizeClassNames: Record<ButtonSize, string> = {
  xsmall:
    'min-h-[var(--dimension-x8)] min-w-[var(--dimension-x8)] gap-[var(--dimension-x1)] rounded-full px-[var(--dimension-x3_5)] py-[var(--dimension-x1_5)]',
  small:
    'min-h-[var(--dimension-x9)] min-w-[var(--dimension-x9)] gap-[var(--dimension-x1)] rounded-[var(--dimension-x2)] px-[var(--dimension-x3_5)] py-[var(--dimension-x2)]',
  medium:
    'min-h-[var(--dimension-x10)] min-w-[var(--dimension-x10)] gap-[var(--dimension-x1_5)] rounded-[var(--dimension-x2)] px-[var(--dimension-x4)] py-[var(--dimension-x2_5)]',
  large:
    'min-h-[var(--dimension-x13)] min-w-[var(--dimension-x13)] gap-[var(--dimension-x2)] rounded-[var(--dimension-x3)] px-[var(--dimension-x5)] py-[var(--dimension-x3_5)]',
};

const iconSizeClassNames: Record<ButtonSize, string> = {
  xsmall: 'size-[14px]',
  small: 'size-[14px]',
  medium: 'size-[16px]',
  large: 'size-[22px]',
};

const loadingIconSizeClassNames: Record<ButtonSize, string> = {
  xsmall: 'size-[14px]',
  small: 'size-[14px]',
  medium: 'size-[16px]',
  large: 'size-[18px]',
};

const widthClassNames: Record<ButtonWidth, string> = {
  hug: 'w-fit',
  fill: 'w-full',
};

const variantClassNames: Record<ButtonVariant, ButtonVariantStyle> = {
  'neutral-solid': {
    enabled:
      'border border-transparent bg-[var(--color-bg-neutral-inverted)] text-[var(--color-fg-neutral-inverted)] active:bg-[var(--color-bg-neutral-inverted-pressed)]',
    loading:
      'border border-transparent bg-[var(--color-bg-neutral-inverted-pressed)] text-[var(--color-fg-neutral-inverted)]',
    disabled:
      'border border-transparent bg-[var(--color-bg-disabled)] text-[var(--color-fg-disabled)]',
  },
  'brand-solid': {
    enabled:
      'border border-transparent bg-[var(--color-bg-brand-solid)] text-[var(--color-fg-neutral-inverted)] active:bg-[var(--color-bg-brand-solid-pressed)]',
    loading:
      'border border-transparent bg-[var(--color-bg-brand-solid-pressed)] text-[var(--color-fg-neutral-inverted)]',
    disabled:
      'border border-transparent bg-[var(--color-bg-disabled)] text-[var(--color-fg-disabled)]',
  },
  'neutral-weak': {
    enabled:
      'border border-transparent bg-[var(--color-bg-neutral-weak)] text-[var(--color-fg-neutral)] active:bg-[var(--color-bg-neutral-weak-pressed)]',
    loading:
      'border border-transparent bg-[var(--color-bg-neutral-weak-pressed)] text-[var(--color-fg-neutral)]',
    disabled:
      'border border-transparent bg-[var(--color-bg-disabled)] text-[var(--color-fg-disabled)]',
  },
  'brand-outline': {
    enabled:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-brand)] active:bg-[var(--color-bg-transparent-pressed)]',
    loading:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-brand)]',
    disabled:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-disabled)]',
  },
  'neutral-outline': {
    enabled:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-neutral)] active:bg-[var(--color-bg-transparent-pressed)]',
    loading:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-neutral)]',
    disabled:
      'border border-[var(--color-stroke-neutral-muted)] bg-[var(--color-bg-transparent)] text-[var(--color-fg-disabled)]',
  },
  'critical-solid': {
    enabled:
      'border border-transparent bg-[var(--color-bg-critical-solid)] text-[var(--color-fg-neutral-inverted)] active:bg-[var(--color-bg-critical-solid-pressed)]',
    loading:
      'border border-transparent bg-[var(--color-bg-critical-solid-pressed)] text-[var(--color-fg-neutral-inverted)]',
    disabled:
      'border border-transparent bg-[var(--color-bg-disabled)] text-[var(--color-fg-disabled)]',
  },
  ghost: {
    enabled:
      'border border-transparent bg-[var(--color-bg-transparent)] text-[var(--color-fg-neutral)] active:bg-[var(--color-bg-transparent-pressed)]',
    loading:
      'border border-transparent bg-[var(--color-bg-transparent-pressed)] text-[var(--color-fg-neutral)]',
    disabled:
      'border border-transparent bg-[var(--color-bg-transparent)] text-[var(--color-fg-disabled)]',
  },
};

function IconSlot({ children, size }: { children: ReactNode; size: ButtonSize }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center', iconSizeClassNames[size])}
    >
      {children}
    </span>
  );
}

function getVisualState(loading: boolean, disabled: boolean) {
  if (loading) {
    return 'loading' as const;
  }

  if (disabled) {
    return 'disabled' as const;
  }

  return 'enabled' as const;
}

export function Button({
  className,
  size = 'medium',
  variant = 'brand-solid',
  width = 'hug',
  loading = false,
  prefixIcon,
  suffixIcon,
  textVariant = 't4Bold',
  children,
  disabled = false,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyles = variantClassNames[variant];
  const visualState = getVisualState(loading, disabled);

  return (
    <BaseButton
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-clip whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)] disabled:cursor-not-allowed',
        sizeClassNames[size],
        widthClassNames[width],
        variantStyles[visualState],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            aria-hidden="true"
            className={cn('shrink-0 animate-spin', loadingIconSizeClassNames[size])}
            strokeWidth={2}
          />
          <Text as="span" className="sr-only" variant="t4Bold">
            {children}
          </Text>
        </>
      ) : (
        <>
          {prefixIcon ? <IconSlot size={size}>{prefixIcon}</IconSlot> : null}
          <Text as="span" variant={textVariant}>
            {children}
          </Text>
          {suffixIcon ? <IconSlot size={size}>{suffixIcon}</IconSlot> : null}
        </>
      )}
    </BaseButton>
  );
}
