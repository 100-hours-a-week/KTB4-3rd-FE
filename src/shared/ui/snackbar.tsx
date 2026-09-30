'use client';

import { Toast } from '@base-ui/react/toast';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';

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

type SnackbarToastData = {
  className?: string;
  icon?: ReactNode | null;
  rootProps?: ComponentPropsWithoutRef<'div'>;
};

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
    return 'gap-[var(--dimension-x2)] pl-[calc(var(--dimension-x2)_+_2px)] pr-[calc(var(--dimension-x2)_+_2px)]';
  }

  if (hasIcon) {
    return 'gap-[var(--dimension-x2)] pl-[calc(var(--dimension-x2)_+_2px)] pr-[calc(var(--dimension-x3)_+_2px)]';
  }

  if (hasAction) {
    return 'gap-[var(--dimension-x2)] px-[calc(var(--dimension-x3)_+_2px)]';
  }

  return 'px-[calc(var(--dimension-x4)_+_2px)]';
}

export function SnackbarToast({ toast }: { toast: Toast.Root.ToastObject }) {
  const data = toast.data as SnackbarToastData | undefined;
  const rootProps = data?.rootProps ?? {};
  const {
    'aria-atomic': ariaAtomic,
    'aria-live': ariaLive,
    className,
    role,
    ...restRootProps
  } = rootProps;
  const type = (toast.type as SnackbarType | undefined) ?? 'default';
  const resolvedIcon = data?.icon === undefined ? getDefaultIcon(type) : data.icon;
  const hasIcon = resolvedIcon !== null && resolvedIcon !== undefined && resolvedIcon !== false;
  const hasAction =
    toast.actionProps?.children !== undefined && toast.actionProps.children !== null;

  return (
    <Toast.Root
      {...restRootProps}
      aria-atomic={ariaAtomic ?? true}
      aria-live={ariaLive ?? (type === 'critical' ? 'assertive' : 'polite')}
      className={cn(
        styles.root,
        'pointer-events-auto flex h-[var(--dimension-x10)] w-[340px] max-w-[calc(100vw-32px)] items-center overflow-clip rounded-[var(--dimension-x2)] bg-[var(--color-bg-neutral-inverted)]',
        getSpacingClassName(hasIcon, hasAction),
        className,
        data?.className,
      )}
      role={role ?? 'status'}
      swipeDirection={[]}
      toast={toast}
    >
      <Toast.Content className="flex h-full min-w-0 flex-1 items-center overflow-clip">
        {hasIcon ? (
          <span className="inline-flex size-[var(--dimension-x6)] shrink-0">{resolvedIcon}</span>
        ) : null}

        <Toast.Description className="min-w-0 flex-1 truncate">
          <Text as="span" color="fg.neutralInverted" variant="t3Regular">
            {toast.description}
          </Text>
        </Toast.Description>

        {hasAction ? (
          <Toast.Action
            className={cn(
              'shrink-0 text-[var(--color-fg-brand)] focus-visible:rounded-[var(--dimension-x1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
              'text-[var(--font-size-t3)] leading-[var(--line-height-t3)] font-[var(--font-weight-bold)]',
              toast.actionProps?.className,
            )}
          />
        ) : null}
      </Toast.Content>
    </Toast.Root>
  );
}

type SnackbarControllerProps = {
  actionProps?: ComponentPropsWithoutRef<'button'>;
  className?: string;
  description: ReactNode;
  icon?: ReactNode | null;
  isOpen: boolean;
  onClose: () => void;
  rootProps: ComponentPropsWithoutRef<'div'>;
  timeout: number;
  type: SnackbarType;
};

function SnackbarController({
  actionProps,
  className,
  description,
  icon,
  isOpen,
  onClose,
  rootProps,
  timeout,
  type,
}: SnackbarControllerProps) {
  const { add, close } = Toast.useToastManager();
  const toastId = `snackbar-${useId()}`;
  const onCloseRef = useRef(onClose);
  const rootPropsRef = useRef(rootProps);

  useEffect(() => {
    onCloseRef.current = onClose;
    rootPropsRef.current = rootProps;
  }, [onClose, rootProps]);

  useEffect(() => {
    if (!isOpen) {
      close(toastId);
      return;
    }

    add({
      actionProps,
      data: { className, icon, rootProps: rootPropsRef.current },
      description,
      id: toastId,
      onClose: () => onCloseRef.current(),
      timeout,
      type,
    });
  }, [actionProps, add, className, close, description, icon, isOpen, timeout, toastId, type]);

  useEffect(
    () => () => {
      close(toastId);
    },
    [close, toastId],
  );

  return null;
}

function SnackbarLocalViewport() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport className="pointer-events-none contents">
      {toasts.map((toast) => (
        <SnackbarToast key={toast.id} toast={toast} />
      ))}
    </Toast.Viewport>
  );
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
  const resolvedTimeout = timeout ?? DEFAULT_TIMEOUT;

  return (
    <Toast.Provider limit={1} timeout={resolvedTimeout}>
      <SnackbarController
        actionProps={actionProps}
        className={className}
        description={description}
        icon={icon}
        isOpen={isOpen}
        onClose={() => {
          if (!isControlled) {
            setUncontrolledOpen(false);
          }

          onOpenChange?.(false);
        }}
        rootProps={props}
        timeout={resolvedTimeout}
        type={type}
      />
      <SnackbarLocalViewport />
    </Toast.Provider>
  );
}
