import Image from 'next/image';
import type { CSSProperties } from 'react';

import { cn } from '@/shared/lib/cn';

export type AvatarSizePreset = 'sm' | 'md' | 'lg';
export type AvatarSize = AvatarSizePreset | number;

export type AvatarProps = {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  className?: string;
  style?: CSSProperties;
};

const sizeClassNames: Record<AvatarSizePreset, string> = {
  sm: 'size-[36px]',
  md: 'size-[42px]',
  lg: 'size-[100px]',
};

const sizePixels: Record<AvatarSizePreset, number> = {
  sm: 36,
  md: 42,
  lg: 100,
};

const DEFAULT_AVATAR_SRC = '/avatars/avatar-default.svg';

export function Avatar({ src, alt = '프로필 이미지', size = 'md', className, style }: AvatarProps) {
  const hasImage = Boolean(src);
  const isCustomSize = typeof size === 'number';
  const pixelSize = isCustomSize ? size : sizePixels[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden rounded-full',
        hasImage && 'border border-[var(--color-stroke-informative-weak)]',
        !isCustomSize && sizeClassNames[size],
        className,
      )}
      style={isCustomSize ? { width: size, height: size, ...style } : style}
    >
      <Image
        alt={alt}
        className="size-full object-cover"
        fill
        sizes={`${pixelSize}px`}
        src={src || DEFAULT_AVATAR_SRC}
        unoptimized
      />
    </span>
  );
}
