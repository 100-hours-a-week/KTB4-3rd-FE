import { queryOptions } from '@tanstack/react-query';

import { getSetupStatus } from './get-setup-status';

export const setupStatusQueries = {
  all: () => ['setup-status'] as const,
  detail: () =>
    queryOptions({
      queryKey: setupStatusQueries.all(),
      queryFn: getSetupStatus,
    }),
};
