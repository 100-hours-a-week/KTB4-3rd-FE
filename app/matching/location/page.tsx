import { Suspense } from 'react';

import { MatchingLocationPage } from '@/_pages/matching';

export default function MatchingLocationRoute() {
  return (
    <Suspense fallback={null}>
      <MatchingLocationPage />
    </Suspense>
  );
}
