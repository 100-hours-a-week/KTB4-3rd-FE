import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TaxiPotLocationAdjustPage } from '@/_pages/taxi-pot-create';

type TaxiPotLocationAdjustRouteProps = {
  searchParams: Promise<{ field?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: TaxiPotLocationAdjustRouteProps): Promise<Metadata> {
  const { field } = await searchParams;
  const locationField = Array.isArray(field) ? field[0] : field;

  return {
    title: locationField === 'destination' ? '도착지 조정' : '출발지 조정',
  };
}

export default function TaxiPotLocationAdjustRoute() {
  return (
    <Suspense fallback={null}>
      <TaxiPotLocationAdjustPage />
    </Suspense>
  );
}
