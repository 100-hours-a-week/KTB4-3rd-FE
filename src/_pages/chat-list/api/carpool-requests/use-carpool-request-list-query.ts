'use client';

import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/client';

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
  const queryClient = useQueryClient();
  const queryOptions = useMemo(
    () => carpoolRequestListQueries.list(viewerId, direction),
    [direction, viewerId],
  );
  const query = useInfiniteQuery({
    ...queryOptions,
    enabled: enabled && viewerId !== null,
  });

  useEffect(() => {
    if (
      !query.isFetchNextPageError ||
      !(query.error instanceof ApiError) ||
      query.error.code !== 'INVALID_CURSOR'
    ) {
      return;
    }

    void queryClient.resetQueries({ queryKey: queryOptions.queryKey, exact: true });
  }, [query.error, query.isFetchNextPageError, queryClient, queryOptions.queryKey]);

  return query;
}
