import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PostWriteLocationPage } from '@/_pages/post-write-location';

export const metadata: Metadata = {
  title: '게시글 위치 입력',
};

export default function PostWriteLocation() {
  return (
    <Suspense fallback={null}>
      <PostWriteLocationPage />
    </Suspense>
  );
}
