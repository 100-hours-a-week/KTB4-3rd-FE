'use client';

import { useEffect, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Icon } from './icon';
import styles from './snackbar.module.css';
import { Text } from './text';

export type SnackbarType = 'default' | 'positive' | 'critical';

type SnackbarOwnProps = {
  /** Optional prefix content. Positive and critical types use their SEED icon by default. */
  icon?: ReactNode | null;
  /** Base UI Toast description displayed in the snackbar. */
  description: ReactNode;
  /** Base UI Toast action props, including children and onClick. */
  actionProps?: ComponentPropsWithoutRef<'button'>;
  /** Base UI Toast timeout in milliseconds. Pass 0 to keep the snackbar visible. */
  timeout?: number;
  /** Base UI Toast type used as the visual variant. */
  type?: SnackbarType;
  /** Controls visibility. When omitted, the snackbar starts visible and manages its own timeout. */
  open?: boolean;
  /** Called when timeout auto-dismisses the snackbar. */
  onOpenChange?: (open: boolean) => void;
};

export type SnackbarProps = SnackbarOwnProps &
  Omit<ComponentPropsWithoutRef<'div'>, keyof SnackbarOwnProps | 'children'>;

const defaultIconNames: Record<
  Exclude<SnackbarType, 'default'>,
  'checkmarkCircle' | 'exclamationmarkCircleFill'
> = {
  positive: 'checkmarkCircle',
  critical: 'exclamationmarkCircleFill',
};

const defaultIconColors: Record<Exclude<SnackbarType, 'default'>, string> = {
  positive: 'var(--color-fg-positive)',
  critical: 'var(--color-fg-critical)',
};

const DEFAULT_TIMEOUT = 5000;

function getDefaultIcon(type: SnackbarType): ReactNode | null {
  if (type === 'default') {
    return null;
  }

  return (
    <Icon
      aria-hidden="true"
      color={defaultIconColors[type]}
      name={defaultIconNames[type]}
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
  actionProps,
  className,
  description,
  icon,
  onOpenChange,
  open,
  timeout,
  type = 'default',
  ...props
}: SnackbarProps) {
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(true);
  const isOpen = isControlled ? open : uncontrolledOpen;
  const resolvedIcon = icon === undefined ? getDefaultIcon(type) : icon;
  const hasIcon = resolvedIcon !== null && resolvedIcon !== undefined && resolvedIcon !== false;
  const hasAction = actionProps?.children !== undefined && actionProps.children !== null;
  const resolvedTimeout = timeout ?? DEFAULT_TIMEOUT;

  useEffect(() => {
    if (!isOpen || resolvedTimeout <= 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!isControlled) {
        setUncontrolledOpen(false);
      }

      onOpenChange?.(false);
    }, resolvedTimeout);

    return () => window.clearTimeout(timeoutId);
  }, [isControlled, isOpen, onOpenChange, resolvedTimeout]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      {...props}
      aria-atomic={props['aria-atomic'] ?? true}
      aria-live={props['aria-live'] ?? (type === 'critical' ? 'assertive' : 'polite')}
      className={cn(
        styles.root,
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
        {description}
      </Text>

      {hasAction ? (
        <button
          {...actionProps}
          className={cn(
            'shrink-0 text-[var(--color-fg-brand)] focus-visible:rounded-[var(--dimension-x1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
            actionProps.className,
          )}
          type={actionProps.type ?? 'button'}
        >
          <Text as="span" color="fg.brand" variant="t3Bold">
            {actionProps.children}
          </Text>
        </button>
      ) : null}
    </div>
  );
}
