import { queryOptions } from '@tanstack/react-query';

import { getCurrentTaxiPot } from './taxi-pot-matching';

export const taxiPotMatchingQueries = {
  all: () => ['taxi-pot-matching'] as const,
  current: (enabled = true) =>
    queryOptions({
      queryKey: [...taxiPotMatchingQueries.all(), 'current'] as const,
      queryFn: getCurrentTaxiPot,
      enabled,
      staleTime: 0,
      refetchOnMount: 'always' as const,
      refetchOnReconnect: 'always' as const,
    }),
};
