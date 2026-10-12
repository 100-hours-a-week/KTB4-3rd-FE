import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '게시글 상세',
  robots: {
    index: true,
    follow: true,
  },
};

export { PostDetailPage as default } from '@/_pages/post-detail';
