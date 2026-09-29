'use client';

import { useQuery } from '@tanstack/react-query';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';

import { userProfileQueries } from '@/features/user-profile/api/user-profile.queries';

export function useCurrentUserQuery() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    ...userProfileQueries.current(),
    enabled: isAuthenticated,
  });
}
