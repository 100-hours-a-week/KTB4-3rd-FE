import type { Metadata } from 'next';

import { PostLocationPage } from '@/_pages/post-location';

export const metadata: Metadata = {
  title: '게시글 위치 선택',
};

export default function PostLocationRoute() {
  return <PostLocationPage />;
}
