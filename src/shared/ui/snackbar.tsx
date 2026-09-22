'use client';

import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';
import { Text } from './text';

export type SnackbarVariant = 'default' | 'positive' | 'critical';

type SnackbarOwnProps = {
  /** Optional prefix content. Positive and critical variants use their SEED icon by default. */
  icon?: ReactNode | null;
  /** Message displayed in the snackbar. */
  content: ReactNode;
  /** Label displayed in the optional action button. */
  actionButton?: ReactNode | null;
  /** Called when the action button is clicked. */
  actionClick?: MouseEventHandler<HTMLButtonElement>;
  /** Auto-dismiss delay in milliseconds. Omit or pass 0 to keep the snackbar visible. */
  durationTime?: number;
  /** Visual variant from the Figma component. */
  variant?: SnackbarVariant;
  /** Controls visibility. When omitted, the snackbar starts visible and manages its own timeout. */
  open?: boolean;
  /** Called when durationTime auto-dismisses the snackbar. */
  onOpenChange?: (open: boolean) => void;
};

export type SnackbarProps = SnackbarOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SnackbarOwnProps | 'children'>;

const defaultIconNames: Record<
  Exclude<SnackbarVariant, 'default'>,
  'checkmarkCircle' | 'exclamationmarkCircleFill'
> = {
  positive: 'checkmarkCircle',
  critical: 'exclamationmarkCircleFill',
};

const defaultIconColors: Record<Exclude<SnackbarVariant, 'default'>, string> = {
  positive: 'var(--color-fg-positive)',
  critical: 'var(--color-fg-critical)',
};

function getDefaultIcon(variant: SnackbarVariant): ReactNode | null {
  if (variant === 'default') {
    return null;
  }

  return (
    <Icon
      aria-hidden="true"
      color={defaultIconColors[variant]}
      name={defaultIconNames[variant]}
      size={24}
    />
  );
}

function getSpacingClassName(hasIcon: boolean, hasAction: boolean) {
  if (hasIcon && hasAction) {
    return 'gap-[var(--dimension-x2)] pl-[var(--dimension-x2)] pr-[var(--dimension-x2)]';
  }

  if (hasIcon) {
    return 'gap-[var(--dimension-x2)] pl-[var(--dimension-x2)] pr-[var(--dimension-x3)]';
  }

  if (hasAction) {
    return 'gap-[var(--dimension-x2)] px-[var(--dimension-x3)]';
  }

  return 'px-[var(--dimension-x4)]';
}

export function Snackbar({
  actionButton,
  actionClick,
  className,
  content,
  durationTime,
  icon,
  onOpenChange,
  open,
  variant = 'default',
  ...props
}: SnackbarProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const isOpen = isControlled ? open : uncontrolledOpen;
  const resolvedIcon = icon === undefined ? getDefaultIcon(variant) : icon;
  const hasIcon = resolvedIcon !== null && resolvedIcon !== undefined && resolvedIcon !== false;
  const hasAction =
    actionButton !== null &&
    actionButton !== undefined &&
    actionButton !== false &&
    actionButton !== '';

  useEffect(() => {
    if (!isOpen || durationTime === undefined || durationTime <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!isControlled) {
        setUncontrolledOpen(false);
      }

      onOpenChange?.(false);
    }, durationTime);

    return () => window.clearTimeout(timeoutId);
  }, [durationTime, isControlled, isOpen, onOpenChange]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      {...props}
      aria-atomic={props['aria-atomic'] ?? true}
      aria-live={props['aria-live'] ?? (variant === 'critical' ? 'assertive' : 'polite')}
      className={cn(
        'flex h-[var(--dimension-x10)] w-[340px] max-w-[calc(100vw-32px)] items-center overflow-clip rounded-[var(--dimension-x2)] bg-[var(--color-bg-neutral-inverted)]',
        getSpacingClassName(hasIcon, hasAction),
        className,
      )}
      role={props.role ?? 'status'}
    >
      {hasIcon ? (
        <span className="inline-flex size-[var(--dimension-x6)] shrink-0">{resolvedIcon}</span>
      ) : null}

      <Text className="min-w-0 flex-1 truncate" color="fg.neutralInverted" variant="t3Regular">
        {content}
      </Text>

      {hasAction ? (
        <button
          className="shrink-0 text-[var(--color-fg-brand)] focus-visible:rounded-[var(--dimension-x1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]"
          onClick={actionClick}
          type="button"
        >
          <Text as="span" color="fg.brand" variant="t3Bold">
            {actionButton}
          </Text>
        </button>
      ) : null}
    </div>
  );
}
