'use client';

import Image from 'next/image';
import { useState } from 'react';

import { canOptimizeProfileImage } from '@/shared/lib/profile-image-optimization';

const CHAT_AVATAR_PLACEHOLDER_SRC = '/avatars/chat-avatar-placeholder.svg';

export function ChatItemAvatar({ src }: { src: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src && failedSrc !== src ? src : CHAT_AVATAR_PLACEHOLDER_SRC;

  return (
    <Image
      alt="방장 프로필 이미지"
      className="size-12 shrink-0 rounded-full object-cover"
      height={48}
      onError={() => setFailedSrc(src)}
      src={imageSrc}
      unoptimized={!canOptimizeProfileImage(imageSrc)}
      width={48}
    />
  );
}
