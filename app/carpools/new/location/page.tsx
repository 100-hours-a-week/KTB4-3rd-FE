import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CarpoolLocationPage } from '@/_pages/carpool-create';

export const metadata: Metadata = {
  title: '카풀 장소 선택',
};

export default function CarpoolLocationRoute() {
  return (
    <Suspense fallback={null}>
      <CarpoolLocationPage />
    </Suspense>
  );
}
