import type { ApiResponse } from '@/shared/api/types';

export type GroupSettlementStatus = 'PENDING' | 'REQUESTED' | 'COMPLETED';
export type MeterAnalysisStatus = 'PENDING' | 'ANALYZING' | 'PASSED' | 'FAILED' | 'MANUAL';
export type MemberAnalysisStatus = 'PENDING' | 'ANALYZING' | 'PASSED' | 'FAILED';

export type CreateSettlementRequest = {
  companion_id: number;
  meter_image_key: string;
};

export type CreateSettlementResponse = ApiResponse<{
  settlement_id: number;
  participant_count: number;
  group_settlement_status: GroupSettlementStatus;
  meter_analysis_status: MeterAnalysisStatus;
  analysis_started_at?: string;
  remaining_meter_attempts: number;
}>;

export type SettlementAnalysisStatusResponse = ApiResponse<{
  group_settlement_status: GroupSettlementStatus;
  meter_analysis_status: MeterAnalysisStatus;
  total_amount: number | null;
  analysis_started_at?: string;
  remaining_meter_attempts: number;
}>;

export type SubmitMeterImageRequest = {
  meter_image_key: string;
};

export type SubmitMeterImageResponse = SettlementAnalysisStatusResponse;

export type UpdateSettlementAmountRequest = {
  total_amount: number;
};

export type UpdateSettlementAmountResponse = ApiResponse<{
  participant_count: number;
  amount_per_person: number;
  group_settlement_status: 'REQUESTED';
  meter_analysis_status: 'MANUAL';
}>;

export type SubmitTransferProofRequest = {
  transfer_image_key: string;
};

export type SubmitTransferProofResponse = ApiResponse<{
  group_settlement_status: 'REQUESTED';
  remaining_transfer_attempts: number;
}>;

export type SettlementPayee = {
  name: string;
  bank_name: string;
  account_no: string;
};

export type MySettlementParticipantResponse = ApiResponse<
  | {
      participant_count: number;
      group_settlement_status: 'PENDING';
    }
  | {
      participant_count: number;
      group_settlement_status: 'REQUESTED' | 'COMPLETED';
      member_analysis_status: MemberAnalysisStatus;
      amount: number;
      payee: SettlementPayee;
      transferred_at?: string;
    }
>;

export type SettlementTransferProofResponse = ApiResponse<{
  member_analysis_status: MemberAnalysisStatus;
  image_url?: string;
  transferred_at?: string;
}>;

export type SettlementMeterImageResponse = ApiResponse<{
  meter_analysis_status: MeterAnalysisStatus;
  image_url?: string;
}>;

export type SettlementParticipant = {
  user_id: number;
  name: string;
  profile_image_url: string | null;
  amount: number;
  member_analysis_status: MemberAnalysisStatus;
  transferred_at?: string;
  has_transfer_proof: boolean;
};

export type SettlementStatusResponse = ApiResponse<{
  id: number;
  group_settlement_status: GroupSettlementStatus;
  meter_analysis_status: MeterAnalysisStatus;
  total_amount: number | null;
  amount_per_person?: number;
  participant_count: number;
  participants: SettlementParticipant[];
  completed_at?: string;
}>;
