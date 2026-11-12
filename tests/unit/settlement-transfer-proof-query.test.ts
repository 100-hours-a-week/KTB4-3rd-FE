import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/entities/auth';
import { settlementQueries } from '@/features/taxi-pot-settlement/api/settlement.queries';

afterEach(() => {
  useAuthStore.getState().clearTokens();
});

describe('settlement transfer proof query', () => {
  it('uses the MSW endpoint and returns the target member analysis status', async () => {
    useAuthStore.getState().setAccessToken('mock-access-token');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    try {
      const response = await queryClient.fetchQuery(settlementQueries.transferProof(77, 8));

      expect(response.data).toEqual({ member_analysis_status: 'PENDING' });
    } finally {
      queryClient.clear();
    }
  });

  it('preserves the API permission error for a different passenger proof', async () => {
    useAuthStore.getState().setAccessToken('mock-settlement-member-token');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    try {
      await expect(
        queryClient.fetchQuery(settlementQueries.transferProof(77, 9)),
      ).rejects.toMatchObject({
        status: 403,
        code: 'TRANSFER_PROOF_FORBIDDEN',
      });
    } finally {
      queryClient.clear();
    }
  });
});
