import { Suspense } from 'react';

import { PostWriteLocationPage } from '@/_pages/post-write-location';

export default function PostWriteLocation() {
  return (
    <Suspense fallback={null}>
      <PostWriteLocationPage />
    </Suspense>
  );
}
