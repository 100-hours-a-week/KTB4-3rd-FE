import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CarpoolLocationAdjustPage } from '@/_pages/carpool-create';

export const metadata: Metadata = {
  title: '카풀 위치 조정',
};

export default function CarpoolLocationAdjustRoute() {
  return (
    <Suspense fallback={null}>
      <CarpoolLocationAdjustPage />
    </Suspense>
  );
}
