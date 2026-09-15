import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { UserRound } from 'lucide-react';

import { cn } from '@/shared/lib/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  className?: string;
};

const sizeClassNames: Record<AvatarSize, string> = {
  sm: 'size-8',
  md: 'size-11',
  lg: 'size-16',
};

export function Avatar({ src, alt, size = 'md', className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sky-700',
        sizeClassNames[size],
        className,
      )}
    >
      {src ? <BaseAvatar.Image className="size-full object-cover" src={src} alt={alt} /> : null}
      <BaseAvatar.Fallback
        aria-hidden="true"
        className="inline-flex size-full items-center justify-center"
      >
        <UserRound className="size-1/2" strokeWidth={1.75} />
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
