import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '매칭',
  robots: {
    index: true,
    follow: true,
  },
};

export { MatchingPage as default } from '@/_pages/matching';
