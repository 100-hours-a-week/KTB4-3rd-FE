import { queryOptions } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { getOwnedCars } from '@/entities/owned-car';

export const ownedCarQueries = {
  all: () => ['owned-cars'] as const,
  list: () =>
    queryOptions({
      queryKey: [...ownedCarQueries.all(), 'list'] as const,
      queryFn: ({ signal }) => getOwnedCarsWithToken(signal),
      refetchOnMount: 'always' as const,
    }),
};

async function getOwnedCarsWithToken(signal: AbortSignal) {
  return getOwnedCars(await getAccessToken(), signal);
}
