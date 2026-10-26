'use client';

import { useQuery } from '@tanstack/react-query';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';

import { ownedCarQueries } from '../api/owned-car.queries'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

export function useOwnedCarListQuery() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery({
    ...ownedCarQueries.list(),
    enabled: isAuthenticated,
  });
}
