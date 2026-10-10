'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import { carpoolDetailQueryKeys } from '@/entities/carpool';
import { useAuthStore } from '@/entities/auth';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

type QueryProviderProps = {
  children: ReactNode;
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: shouldRetryApiQuery,
            retryDelay: API_QUERY_RETRY_DELAY,
          },
        },
      }),
  );

  useEffect(() => {
    let previousIdentity = getAuthIdentity();
    return useAuthStore.subscribe((state) => {
      const nextIdentity = `${state.accessToken ?? ''}:${state.verifiedViewerId ?? ''}`;
      if (nextIdentity === previousIdentity) {
        return;
      }

      previousIdentity = nextIdentity;
      void queryClient.removeQueries({ queryKey: carpoolDetailQueryKeys.all() });
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function getAuthIdentity() {
  const { accessToken, verifiedViewerId } = useAuthStore.getState();
  return `${accessToken ?? ''}:${verifiedViewerId ?? ''}`;
}
