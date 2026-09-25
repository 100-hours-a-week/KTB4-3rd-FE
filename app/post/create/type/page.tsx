'use client';

import { useRouter } from 'next/navigation';

import { PostTypeSelectionPage } from '@/_pages/post-type-selection';
import type { PostType } from '@/entities/post';

const postWriteTypeByPostType: Record<PostType, 'accompany' | 'community'> = {
  COMPANION: 'accompany',
  COMMUNITY: 'community',
};

export default function PostTypeSelection() {
  const router = useRouter();

  return (
    <PostTypeSelectionPage
      backHref="/post/create/location"
      onNext={(type) => router.push(`/posts/write?type=${postWriteTypeByPostType[type]}`)}
    />
  );
}
