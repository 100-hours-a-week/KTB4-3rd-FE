import type { Metadata } from 'next';
import { Suspense } from 'react';

import { TaxiPotLocationPage } from '@/_pages/taxi-pot-create';

type TaxiPotLocationRouteProps = {
  searchParams: Promise<{ field?: string | string[] }>;
};

export async function generateMetadata({
  searchParams,
}: TaxiPotLocationRouteProps): Promise<Metadata> {
  const { field } = await searchParams;
  const locationField = Array.isArray(field) ? field[0] : field;

  return {
    title: locationField === 'destination' ? '도착지 선택' : '출발지 선택',
  };
}

export default function TaxiPotLocationRoute() {
  return (
    <Suspense fallback={null}>
      <TaxiPotLocationPage />
    </Suspense>
  );
}
