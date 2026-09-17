import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './text.module.css';

export type TextVariant =
  | 'screenTitle'
  | 'articleBody'
  | 't4Regular'
  | 't4Bold'
  | 't4StaticRegular'
  | 'modalTitle';

type TextOwnProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: TextVariant;
};

export type TextProps<T extends ElementType = 'span'> = TextOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof TextOwnProps>;

const variantClassNames: Record<TextVariant, string> = {
  screenTitle: styles.screenTitle,
  articleBody: styles.articleBody,
  t4Regular: styles.t4Regular,
  t4Bold: styles.t4Bold,
  t4StaticRegular: styles.t4StaticRegular,
  modalTitle: styles.modalTitle,
};

export function Text<T extends ElementType = 'span'>({
  as,
  children,
  className,
  variant = 'articleBody',
  ...props
}: TextProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component className={cn(styles.root, variantClassNames[variant], className)} {...props}>
      {children}
    </Component>
  );
}
