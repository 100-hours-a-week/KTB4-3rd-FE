import type { Metadata } from 'next';

import { PostTypeSelectionRoute } from '@/_pages/post-type-selection';

export const metadata: Metadata = {
  title: '게시글 유형 선택',
};

export default function PostTypeSelection() {
  return <PostTypeSelectionRoute />;
}
