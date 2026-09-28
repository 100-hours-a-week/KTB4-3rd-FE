import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MatchingLocationPage } from '@/_pages/matching';

export const metadata: Metadata = {
  title: '출발지 선택',
};

export default function MatchingLocationRoute() {
  return (
    <Suspense fallback={null}>
      <MatchingLocationPage />
    </Suspense>
  );
}
