import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import styles from './text.module.css';

export const textVariants = [
  'screenTitle',
  'articleBody',
  't1Regular',
  't1Bold',
  't2Regular',
  't2Bold',
  't3Regular',
  't3Bold',
  't4Regular',
  't4Bold',
  't5Regular',
  't5Bold',
  't6Regular',
  't6Bold',
  't7Regular',
  't7Bold',
  't8Regular',
  't8Bold',
  't9Regular',
  't9Bold',
  't10Regular',
  't10Bold',
  't11Regular',
  't11Bold',
  't12Regular',
  't12Bold',
  't13Regular',
  't13Bold',
  't14Regular',
  't14Bold',
] as const;

export type TextVariant = (typeof textVariants)[number];

export type TextScale =
  | 't1'
  | 't2'
  | 't3'
  | 't4'
  | 't5'
  | 't6'
  | 't7'
  | 't8'
  | 't9'
  | 't10'
  | 't11'
  | 't12'
  | 't13'
  | 't14';

export type TextFontSize = TextScale;
export type TextLineHeight = TextFontSize;
export type TextFontWeight = 'regular' | 'medium' | 'bold';
export type TextAlign = 'center' | 'left' | 'right';
export type TextWhiteSpace = 'break-spaces' | 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap';
export type TextUserSelect = 'auto' | 'none' | 'text';
export type TextDecorationLine = 'none' | 'line-through' | 'underline';

const fontSizeTokens: Record<TextFontSize, string> = {
  t1: 'var(--font-size-t1)',
  t2: 'var(--font-size-t2)',
  t3: 'var(--font-size-t3)',
  t4: 'var(--font-size-t4)',
  t5: 'var(--font-size-t5)',
  t6: 'var(--font-size-t6)',
  t7: 'var(--font-size-t7)',
  t8: 'var(--font-size-t8)',
  t9: 'var(--font-size-t9)',
  t10: 'var(--font-size-t10)',
  t11: 'var(--font-size-t11)',
  t12: 'var(--font-size-t12)',
  t13: 'var(--font-size-t13)',
  t14: 'var(--font-size-t14)',
};

const lineHeightTokens: Record<TextLineHeight, string> = {
  t1: 'var(--line-height-t1)',
  t2: 'var(--line-height-t2)',
  t3: 'var(--line-height-t3)',
  t4: 'var(--line-height-t4)',
  t5: 'var(--line-height-t5)',
  t6: 'var(--line-height-t6)',
  t7: 'var(--line-height-t7)',
  t8: 'var(--line-height-t8)',
  t9: 'var(--line-height-t9)',
  t10: 'var(--line-height-t10)',
  t11: 'var(--line-height-t11)',
  t12: 'var(--line-height-t12)',
  t13: 'var(--line-height-t13)',
  t14: 'var(--line-height-t14)',
};

const fontWeightTokens: Record<TextFontWeight, string> = {
  regular: 'var(--font-weight-regular)',
  medium: 'var(--font-weight-medium)',
  bold: 'var(--font-weight-bold)',
};

const textColorTokens = {
  'fg.brand': 'var(--color-fg-brand)',
  'fg.brandContrast': 'var(--color-fg-brand-contrast)',
  'fg.critical': 'var(--color-fg-critical)',
  'fg.criticalContrast': 'var(--color-fg-critical-contrast)',
  'fg.disabled': 'var(--color-fg-disabled)',
  'fg.informative': 'var(--color-fg-informative)',
  'fg.informativeContrast': 'var(--color-fg-informative-contrast)',
  'fg.neutral': 'var(--color-fg-neutral)',
  'fg.neutralInverted': 'var(--color-fg-neutral-inverted)',
  'fg.neutralMuted': 'var(--color-fg-neutral-muted)',
  'fg.neutralSubtle': 'var(--color-fg-neutral-subtle)',
  'fg.placeholder': 'var(--color-fg-placeholder)',
  'fg.positive': 'var(--color-fg-positive)',
  'fg.positiveContrast': 'var(--color-fg-positive-contrast)',
  'fg.warning': 'var(--color-fg-warning)',
  'fg.warningContrast': 'var(--color-fg-warning-contrast)',
} as const;

export type TextColor = keyof typeof textColorTokens;

type TextStyleProperties = CSSProperties & {
  '--text-max-lines'?: number;
};

type TextOwnProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: TextVariant;
  fontSize?: TextFontSize;
  lineHeight?: TextLineHeight;
  fontWeight?: TextFontWeight;
  maxLines?: number;
  align?: TextAlign;
  whiteSpace?: TextWhiteSpace;
  userSelect?: TextUserSelect;
  textDecorationLine?: TextDecorationLine;
  color?: TextColor;
};

export type TextProps<T extends ElementType = 'span'> = TextOwnProps &
  Omit<ComponentPropsWithoutRef<T>, keyof TextOwnProps>;

const variantClassNames: Record<TextVariant, string> = Object.fromEntries(
  textVariants.map((variant) => [variant, styles[variant]]),
) as Record<TextVariant, string>;

export function Text<T extends ElementType = 'span'>({
  as,
  children,
  className,
  variant = 'articleBody',
  fontSize,
  lineHeight,
  fontWeight,
  maxLines,
  align,
  whiteSpace,
  userSelect,
  textDecorationLine,
  color,
  style,
  ...props
}: TextProps<T>) {
  const Component = as ?? 'span';
  const hasValidMaxLines = maxLines !== undefined && Number.isFinite(maxLines) && maxLines > 0;
  const resolvedLineHeight = lineHeight ?? fontSize;
  const resolvedStyle: TextStyleProperties = {
    ...(fontSize ? { fontSize: fontSizeTokens[fontSize] } : {}),
    ...(resolvedLineHeight ? { lineHeight: lineHeightTokens[resolvedLineHeight] } : {}),
    ...(fontWeight ? { fontWeight: fontWeightTokens[fontWeight] } : {}),
    ...(hasValidMaxLines ? { '--text-max-lines': maxLines } : {}),
    ...(align ? { textAlign: align } : {}),
    ...(whiteSpace ? { whiteSpace } : {}),
    ...(userSelect ? { userSelect } : {}),
    ...(textDecorationLine ? { textDecorationLine } : {}),
    ...(color ? { color: textColorTokens[color] } : {}),
    ...style,
  };

  return (
    <Component
      {...props}
      className={cn(
        styles.root,
        variantClassNames[variant],
        hasValidMaxLines && styles.maxLines,
        className,
      )}
      style={resolvedStyle}
    >
      {children}
    </Component>
  );
}
