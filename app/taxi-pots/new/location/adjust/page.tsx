import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TaxiPotLocationAdjustPage } from '@/_pages/taxi-pot-create';

export const metadata: Metadata = {
  title: '출발지 조정',
};

export default function TaxiPotLocationAdjustRoute() {
  return (
    <Suspense fallback={null}>
      <TaxiPotLocationAdjustPage />
    </Suspense>
  );
}
