import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TaxiPotLocationPage } from '@/_pages/taxi-pot-create';

export const metadata: Metadata = {
  title: '출발지 선택',
};

export default function TaxiPotLocationRoute() {
  return (
    <Suspense fallback={null}>
      <TaxiPotLocationPage />
    </Suspense>
  );
}
