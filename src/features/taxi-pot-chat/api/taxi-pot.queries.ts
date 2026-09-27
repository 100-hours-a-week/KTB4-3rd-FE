import { queryOptions } from '@tanstack/react-query';

import { getTaxiPotDetail } from './taxi-pot';

export const taxiPotQueries = {
  all: () => ['taxi-pots'] as const,
  detail: (taxiPotId: string) =>
    queryOptions({
      queryKey: [...taxiPotQueries.all(), 'detail', taxiPotId] as const,
      queryFn: () => getTaxiPotDetail(taxiPotId),
    }),
};
