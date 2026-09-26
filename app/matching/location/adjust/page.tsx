import { Suspense } from 'react';

import { MatchingLocationAdjustPage } from '@/_pages/matching';

export default function MatchingLocationAdjustRoute() {
  return (
    <Suspense fallback={null}>
      <MatchingLocationAdjustPage />
    </Suspense>
  );
}
