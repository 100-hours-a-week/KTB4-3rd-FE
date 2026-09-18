import type { CSSProperties } from 'react';
import Image from 'next/image';

import { cn } from '@/shared/lib/cn';

export type LogoVariant = 'full' | 'text' | 'symbol';
export type LogoSizePreset = 'sm' | 'md' | 'lg';
export type LogoSize = LogoSizePreset | number | string;

export type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

const logoSizeTokens: Record<LogoSizePreset, string> = {
  sm: '40px',
  md: '72px',
  lg: '200px',
};

const logoAssets: Record<LogoVariant, { height: number; src: string; width: number }> = {
  full: {
    height: 308,
    src: '/logos/logo_full.svg',
    width: 303,
  },
  text: {
    height: 120,
    src: '/logos/logo_text.svg',
    width: 272,
  },
  symbol: {
    height: 178,
    src: '/logos/logo_symbol.svg',
    width: 178,
  },
};

function resolveLogoSize(size: LogoSize): CSSProperties['height'] {
  if (typeof size === 'number') {
    return size;
  }

  return logoSizeTokens[size as LogoSizePreset] ?? size;
}

export function Logo({ variant = 'full', size = 'md', href, alt, className, style }: LogoProps) {
  const asset = logoAssets[variant];
  const isLink = typeof href === 'string';
  const resolvedAlt = alt ?? (isLink ? '모여타' : '');
  const imageStyle: CSSProperties = {
    display: 'block',
    height: resolveLogoSize(size),
    width: variant === 'symbol' ? resolveLogoSize(size) : 'auto',
    ...style,
  };
  const image = (
    <Image
      aria-hidden={resolvedAlt === '' ? true : undefined}
      alt={resolvedAlt}
      height={asset.height}
      unoptimized
      src={asset.src}
      style={imageStyle}
      width={asset.width}
    />
  );
  const rootClassName = cn(
    'inline-flex shrink-0 items-center justify-center',
    isLink &&
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-stroke-focus-ring)]',
    className,
  );

  if (isLink) {
    return (
      <a className={rootClassName} href={href}>
        {image}
      </a>
    );
  }

  return <span className={rootClassName}>{image}</span>;
}
