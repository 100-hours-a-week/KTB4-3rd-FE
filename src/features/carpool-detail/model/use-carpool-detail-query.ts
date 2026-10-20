'use client';

import { useQuery } from '@tanstack/react-query';

import {
  carpoolDetailQueries,
  type CarpoolDetailQueryParams,
} from '@/features/carpool-detail/api/carpool-detail.queries';

export function useCarpoolDetailQuery(params: CarpoolDetailQueryParams) {
  return useQuery(carpoolDetailQueries.detail(params));
}
