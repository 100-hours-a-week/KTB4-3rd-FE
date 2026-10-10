'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { carpoolRequestListQueries } from './carpool-requests.queries';
import type { CarpoolRequestDirection } from './carpool-requests.types';

export function useCarpoolRequestListQuery({
  direction,
  enabled,
  viewerId,
}: {
  direction: CarpoolRequestDirection;
  enabled: boolean;
  viewerId: number | null;
}) {
  return useInfiniteQuery({
    ...carpoolRequestListQueries.list(viewerId, direction),
    enabled: enabled && viewerId !== null,
  });
}
