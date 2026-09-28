import type { Metadata } from 'next';
import { Suspense } from 'react';

import { MatchingLocationAdjustPage } from '@/_pages/matching';

export const metadata: Metadata = {
  title: '출발지 조정',
};

export default function MatchingLocationAdjustRoute() {
  return (
    <Suspense fallback={null}>
      <MatchingLocationAdjustPage />
    </Suspense>
  );
}
