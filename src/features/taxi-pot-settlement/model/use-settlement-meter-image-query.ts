'use client';

import { useQuery } from '@tanstack/react-query';

import { selectIsAuthenticated, useAuthStore } from '@/entities/auth';
import { settlementQueries } from '@/features/taxi-pot-settlement/api/settlement.queries';

export function useSettlementMeterImageQuery(settlementId?: number, enabled = true) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useQuery(settlementQueries.meterImage(settlementId, enabled && isAuthenticated));
}
