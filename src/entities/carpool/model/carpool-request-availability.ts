import type { CarpoolRequestStatus } from './carpool-request';

export type CarpoolRequestAvailabilityReason =
  | 'host'
  | 'participant'
  | 'pending-request'
  | 'accepted-request'
  | 'canceled'
  | 'completed'
  | 'in-progress'
  | 'invalid-status'
  | 'invalid-departure-time'
  | 'departure-passed'
  | 'full';

export type CarpoolRequestAvailability =
  | { state: 'available'; canRequest: true; reason: null; message: null }
  | { state: 'checking'; canRequest: false; reason: null; message: string }
  | {
      state: 'disabled';
      canRequest: false;
      reason: CarpoolRequestAvailabilityReason;
      message: string;
    };

export type CarpoolRequestAvailabilityInput = {
  status: string;
  myRequestStatus?: CarpoolRequestStatus;
  isHost: boolean;
  isParticipant: boolean;
  isCheckingRequest: boolean;
  isFull: boolean;
  /** Parsed absolute departure time. Null or a non-finite number means the value was invalid. */
  departureTimestamp: number | null;
  nowTimestamp: number;
};

const disabledMessages: Record<CarpoolRequestAvailabilityReason, string> = {
  host: '본인이 등록한 카풀에는 요청할 수 없어요.',
  participant: '이미 참여 중인 카풀이에요.',
  'pending-request': '동행 요청을 보낸 상태예요.',
  'accepted-request': '이미 수락된 요청이에요.',
  canceled: '취소된 카풀이에요.',
  completed: '이미 완료된 카풀이에요.',
  'in-progress': '운행 중인 카풀이에요.',
  'invalid-status': '카풀 상태를 확인할 수 없어요.',
  'invalid-departure-time': '출발 시각을 확인할 수 없어요.',
  'departure-passed': '출발 시각이 지난 카풀이에요.',
  full: '카풀 정원이 가득 찼어요.',
};

function disabled(reason: CarpoolRequestAvailabilityReason): CarpoolRequestAvailability {
  return { state: 'disabled', canRequest: false, reason, message: disabledMessages[reason] };
}

/**
 * Applies the request button's spec priority to already parsed carpool data.
 * The caller owns identity checks and departure-time parsing so UI and preflight
 * validation can share the same time-zone contract.
 */
export function getCarpoolRequestAvailability(
  input: CarpoolRequestAvailabilityInput,
): CarpoolRequestAvailability {
  if (input.isCheckingRequest) {
    return {
      state: 'checking',
      canRequest: false,
      reason: null,
      message: '최신 카풀 정보를 확인하고 있어요.',
    };
  }

  if (input.isHost) {
    return disabled('host');
  }
  if (input.isParticipant) {
    return disabled('participant');
  }
  if (input.myRequestStatus === 'PENDING') {
    return disabled('pending-request');
  }
  if (input.myRequestStatus === 'ACCEPTED') {
    return disabled('accepted-request');
  }
  if (input.status === 'CANCELED') {
    return disabled('canceled');
  }
  if (input.status === 'COMPLETED') {
    return disabled('completed');
  }
  if (input.status === 'IN_PROGRESS') {
    return disabled('in-progress');
  }
  if (input.status !== 'RECRUITING') {
    return disabled('invalid-status');
  }

  if (
    input.departureTimestamp === null ||
    !Number.isFinite(input.departureTimestamp) ||
    !Number.isFinite(input.nowTimestamp)
  ) {
    return disabled('invalid-departure-time');
  }
  if (input.departureTimestamp <= input.nowTimestamp) {
    return disabled('departure-passed');
  }
  if (input.isFull) {
    return disabled('full');
  }

  return { state: 'available', canRequest: true, reason: null, message: null };
}
