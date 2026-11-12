'use client';

import { useQuery } from '@tanstack/react-query';

import { taxiPotMatchingQueries } from '@/features/taxi-pot-matching/api/taxi-pot-matching.queries';

export function useCurrentTaxiPotQuery(options?: { enabled?: boolean }) {
  return useQuery(taxiPotMatchingQueries.current(options?.enabled ?? true));
}
