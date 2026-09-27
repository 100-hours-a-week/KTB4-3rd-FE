import { queryOptions } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { getCurrentUser } from '@/entities/user';

export const userProfileQueries = {
  all: () => ['user-profile'] as const,
  current: () =>
    queryOptions({
      queryKey: [...userProfileQueries.all(), 'current'] as const,
      queryFn: async () => getCurrentUser(await getAccessToken()),
      refetchOnMount: 'always' as const,
    }),
};
