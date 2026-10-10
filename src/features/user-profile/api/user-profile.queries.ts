import { queryOptions } from '@tanstack/react-query';

import { getAccessToken, useAuthStore } from '@/entities/auth';
import { getCurrentUser } from '@/entities/user';

export const userProfileQueries = {
  all: () => ['user-profile'] as const,
  current: () =>
    queryOptions({
      queryKey: [...userProfileQueries.all(), 'current'] as const,
      queryFn: async () => {
        const accessToken = await getAccessToken();
        const response = await getCurrentUser(accessToken);
        useAuthStore.getState().setVerifiedViewerId(accessToken, response.data.id);
        return response;
      },
      refetchOnMount: 'always' as const,
    }),
};
