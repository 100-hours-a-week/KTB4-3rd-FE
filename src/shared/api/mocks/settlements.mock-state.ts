import { HttpResponse } from 'msw';

import { errorResponse, getBearerToken, MOCK_ACCESS_TOKEN } from './mock-utils';

export type GroupSettlementStatus = 'PENDING' | 'REQUESTED' | 'COMPLETED';
export type MeterAnalysisStatus = 'ANALYZING' | 'PASSED' | 'FAILED' | 'MANUAL';
export type MemberAnalysisStatus = 'PENDING' | 'ANALYZING' | 'PASSED' | 'FAILED';

export type MockSettlementParticipant = {
  user_id: number;
  name: string;
  profile_image_url: string | null;
  member_analysis_status: MemberAnalysisStatus;
  transferred_at?: string;
  transfer_image_url?: string;
  transfer_attempts: number;
  analysis_result_pending: boolean;
  is_forged: boolean;
};

export type MockSettlement = {
  id: number;
  companion_id: number;
  host_id: number;
  host_name: string;
  host_bank_name: string;
  host_account_no: string;
  participant_count: number;
  group_settlement_status: GroupSettlementStatus;
  meter_analysis_status: MeterAnalysisStatus;
  meter_image_url?: string;
  meter_analysis_result_pending: boolean;
  total_amount: number | null;
  analysis_started_at?: string;
  amount_per_person?: number;
  completed_at?: string;
  participants: MockSettlementParticipant[];
};

export const MOCK_SETTLEMENT_SCENARIOS = {
  DEFAULT_SETTLEMENT_ID: 77,
  MEMBER_TOKEN: 'mock-settlement-member-token',
  SECOND_MEMBER_TOKEN: 'mock-settlement-second-member-token',
  NON_PARTICIPANT_TOKEN: 'mock-settlement-non-participant-token',
} as const;

const MOCK_USERS = [
  { id: 7, name: '김방장', profile_image_url: 'https://cdn.moyeota.app/profile/15.jpg' },
  { id: 8, name: '이다라', profile_image_url: 'https://cdn.moyeota.app/profile/43.jpg' },
  { id: 9, name: '박마바', profile_image_url: null },
] as const;

export function currentTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

function createMockSettlements() {
  const defaultSettlement: MockSettlement = {
    id: MOCK_SETTLEMENT_SCENARIOS.DEFAULT_SETTLEMENT_ID,
    companion_id: 33,
    host_id: 7,
    host_name: '김방장',
    host_bank_name: 'kb',
    host_account_no: '11012345678',
    participant_count: 3,
    group_settlement_status: 'PENDING',
    meter_analysis_status: 'ANALYZING',
    meter_analysis_result_pending: false,
    total_amount: null,
    analysis_started_at: currentTimestamp(),
    participants: [
      {
        user_id: 8,
        name: '이다라',
        profile_image_url: 'https://cdn.moyeota.app/profile/43.jpg',
        member_analysis_status: 'PENDING',
        transfer_attempts: 0,
        analysis_result_pending: false,
        is_forged: false,
      },
      {
        user_id: 9,
        name: '박마바',
        profile_image_url: null,
        member_analysis_status: 'PENDING',
        transfer_attempts: 0,
        analysis_result_pending: false,
        is_forged: false,
      },
    ],
  };

  return new Map<number, MockSettlement>([[defaultSettlement.id, defaultSettlement]]);
}

let mockSettlements = createMockSettlements();
let nextSettlementId = MOCK_SETTLEMENT_SCENARIOS.DEFAULT_SETTLEMENT_ID + 1;

export function resetSettlementMockState() {
  mockSettlements = createMockSettlements();
  nextSettlementId = MOCK_SETTLEMENT_SCENARIOS.DEFAULT_SETTLEMENT_ID + 1;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getCurrentUserId(request: Request) {
  const token = getBearerToken(request);

  if (token === MOCK_ACCESS_TOKEN) {
    return 7;
  }
  if (token === MOCK_SETTLEMENT_SCENARIOS.MEMBER_TOKEN) {
    return 8;
  }
  if (token === MOCK_SETTLEMENT_SCENARIOS.SECOND_MEMBER_TOKEN) {
    return 9;
  }
  if (token === MOCK_SETTLEMENT_SCENARIOS.NON_PARTICIPANT_TOKEN) {
    return 99;
  }

  return null;
}

export function unauthorizedResponse() {
  return HttpResponse.json(
    { message: '로그인이 필요합니다', error: { code: 'UNAUTHORIZED', field: null } },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
  );
}

export function notFoundResponse() {
  return errorResponse('존재하지 않는 정산입니다', 'SETTLEMENT_NOT_FOUND', null, 404);
}

export function serverErrorResponse() {
  return errorResponse('서버 오류가 발생했습니다', 'INTERNAL_SERVER_ERROR', null, 500);
}

export function getSettlement(settlementId: string) {
  const id = Number(settlementId);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return undefined;
  }
  if (id === 999) {
    return 'internal-server-error';
  }

  return mockSettlements.get(id);
}

export function isParticipant(settlement: MockSettlement, userId: number) {
  return (
    settlement.host_id === userId || settlement.participants.some((item) => item.user_id === userId)
  );
}

export function getParticipant(settlement: MockSettlement, userId: number) {
  return settlement.participants.find((item) => item.user_id === userId);
}

export function groupError(status: GroupSettlementStatus) {
  return status === 'REQUESTED' || status === 'COMPLETED';
}

export function advanceMemberAnalysis(participant: MockSettlementParticipant) {
  if (!participant.analysis_result_pending) {
    return;
  }

  participant.analysis_result_pending = false;
  participant.member_analysis_status = participant.transfer_image_url?.includes('failed')
    ? 'FAILED'
    : 'PASSED';

  if (participant.member_analysis_status === 'PASSED') {
    participant.transferred_at = currentTimestamp();
  }
}

export function advanceMeterAnalysis(settlement: MockSettlement) {
  if (!settlement.meter_analysis_result_pending) {
    return;
  }

  settlement.meter_analysis_result_pending = false;
  settlement.meter_analysis_status = settlement.meter_image_url?.includes('failed')
    ? 'FAILED'
    : 'PASSED';

  if (settlement.meter_analysis_status === 'PASSED') {
    settlement.total_amount = 18_000;
    settlement.amount_per_person = Math.floor(
      settlement.total_amount / settlement.participant_count,
    );
    settlement.group_settlement_status = 'REQUESTED';
    settlement.participants.forEach((participant) => {
      participant.member_analysis_status = 'PENDING';
    });
  }
}

export function hasValidImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function createParticipantsForCompanion(companionId: number) {
  if (companionId === 31) {
    return [MOCK_USERS[0], MOCK_USERS[2]];
  }

  return [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2]];
}

export function createSettlement(
  companionId: number,
  participants: typeof MOCK_USERS | readonly (typeof MOCK_USERS)[number][],
) {
  const host = participants.find((participant) => participant.id === 7) ?? MOCK_USERS[0];
  const settlement: MockSettlement = {
    id: nextSettlementId++,
    companion_id: companionId,
    host_id: host.id,
    host_name: host.name,
    host_bank_name: 'kb',
    host_account_no: '11012345678',
    participant_count: participants.length,
    group_settlement_status: 'PENDING',
    meter_analysis_status: 'ANALYZING',
    meter_analysis_result_pending: true,
    meter_image_url: undefined,
    total_amount: null,
    analysis_started_at: currentTimestamp(),
    participants: participants
      .filter((participant) => participant.id !== host.id)
      .map((participant) => ({
        user_id: participant.id,
        name: participant.name,
        profile_image_url: participant.profile_image_url,
        member_analysis_status: 'PENDING',
        transfer_attempts: 0,
        analysis_result_pending: false,
        is_forged: false,
      })),
  };

  mockSettlements.set(settlement.id, settlement);
  return settlement;
}

export { errorResponse };
