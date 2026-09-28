'use client';

import { useRouter } from 'next/navigation';

import type { PostType } from '@/entities/post';

import { PostTypeSelectionPage } from './PostTypeSelectionPage';

const postWriteTypeByPostType: Record<PostType, 'accompany' | 'community'> = {
  COMPANION: 'accompany',
  COMMUNITY: 'community',
};

export function PostTypeSelectionRoute() {
  const router = useRouter();

  return (
    <PostTypeSelectionPage
      backHref="/post/create/location"
      onNext={(type) => router.push(`/posts/write?type=${postWriteTypeByPostType[type]}`)}
    />
  );
}
