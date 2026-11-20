import { queryOptions } from '@tanstack/react-query';

import { getAccessToken } from '@/entities/auth';
import { API_QUERY_RETRY_DELAY, shouldRetryApiQuery } from '@/shared/api/query-retry';

import { getMySettlementParticipant } from './get-my-settlement-participant';
import { getSettlementAnalysisStatus } from './get-settlement-analysis-status';
import { getSettlementStatus } from './get-settlement-status';
import { getSettlementMeterImage } from './get-settlement-meter-image';
import { getSettlementTransferProof } from './get-settlement-transfer-proof';

function hasValidSettlementId(settlementId?: number) {
  return typeof settlementId === 'number' && Number.isSafeInteger(settlementId) && settlementId > 0;
}

function hasValidTransferProofIds(settlementId?: number, userId?: number) {
  return (
    typeof settlementId === 'number' &&
    Number.isSafeInteger(settlementId) &&
    settlementId > 0 &&
    typeof userId === 'number' &&
    Number.isSafeInteger(userId) &&
    userId > 0
  );
}

export const settlementQueries = {
  all: () => ['settlements'] as const,
  status: (settlementId?: number, enabled = true) =>
    queryOptions({
      queryKey: [...settlementQueries.all(), 'status', settlementId] as const,
      queryFn: async ({ signal }) => {
        if (
          settlementId === undefined ||
          !Number.isSafeInteger(settlementId) ||
          settlementId <= 0
        ) {
          throw new Error('정산 정보가 필요합니다');
        }

        return getSettlementStatus(await getAccessToken(), settlementId, signal);
      },
      enabled: enabled && Number.isSafeInteger(settlementId) && (settlementId ?? 0) > 0,
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      staleTime: 0,
    }),
  analysisStatus: (settlementId?: number, enabled = true) =>
    queryOptions({
      queryKey: [...settlementQueries.all(), 'analysis-status', settlementId] as const,
      queryFn: async ({ signal }) => {
        if (settlementId === undefined || !hasValidSettlementId(settlementId)) {
          throw new Error('정산 정보가 필요합니다');
        }

        return getSettlementAnalysisStatus(await getAccessToken(), settlementId, signal);
      },
      enabled: enabled && hasValidSettlementId(settlementId),
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      staleTime: 0,
    }),
  myParticipant: (settlementId?: number, enabled = true) =>
    queryOptions({
      queryKey: [...settlementQueries.all(), 'my-participant', settlementId] as const,
      queryFn: async ({ signal }) => {
        if (settlementId === undefined || !hasValidSettlementId(settlementId)) {
          throw new Error('정산 정보가 필요합니다');
        }

        return getMySettlementParticipant(await getAccessToken(), settlementId, signal);
      },
      enabled: enabled && hasValidSettlementId(settlementId),
      refetchInterval: (query) => {
        const data = query.state.data?.data;
        return data &&
          'member_analysis_status' in data &&
          ['PENDING', 'ANALYZING'].includes(data.member_analysis_status)
          ? 1_000
          : false;
      },
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      staleTime: 0,
    }),
  meterImage: (settlementId?: number, enabled = true) =>
    queryOptions({
      queryKey: [...settlementQueries.all(), 'meter-image', settlementId] as const,
      queryFn: async ({ signal }) => {
        if (settlementId === undefined || !hasValidSettlementId(settlementId)) {
          throw new Error('정산 정보가 필요합니다');
        }

        return getSettlementMeterImage(await getAccessToken(), settlementId, signal);
      },
      enabled: enabled && hasValidSettlementId(settlementId),
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      staleTime: 0,
    }),
  transferProof: (settlementId?: number, userId?: number, enabled = true) =>
    queryOptions({
      queryKey: [...settlementQueries.all(), 'transfer-proof', settlementId, userId] as const,
      queryFn: async ({ signal }) => {
        if (
          settlementId === undefined ||
          userId === undefined ||
          !hasValidTransferProofIds(settlementId, userId)
        ) {
          throw new Error('정산 및 참여자 정보가 필요합니다');
        }

        return getSettlementTransferProof(await getAccessToken(), settlementId, userId, signal);
      },
      enabled: enabled && hasValidTransferProofIds(settlementId, userId),
      retry: shouldRetryApiQuery,
      retryDelay: API_QUERY_RETRY_DELAY,
      staleTime: 0,
    }),
};
