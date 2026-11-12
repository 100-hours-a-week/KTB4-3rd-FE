'use client';

import { useQuery } from '@tanstack/react-query';

import { carpoolRequestReviewQueries } from '@/features/carpool-request-review/api';

type UseCarpoolRequestDetailQueryParams = {
  viewerId: number | null;
  carpoolId: number | null;
  requestId: number | null;
  enabled: boolean;
};

export function useCarpoolRequestDetailQuery(params: UseCarpoolRequestDetailQueryParams) {
  return useQuery(carpoolRequestReviewQueries.detail(params));
}
