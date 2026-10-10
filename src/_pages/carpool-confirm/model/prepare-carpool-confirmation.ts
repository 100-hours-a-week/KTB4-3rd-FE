import type { CarpoolCreatePayload } from '@/features/carpool-create';
import {
  getCarpoolDepartureAt,
  validateCarpoolDepartureAt,
  type CarpoolCreateDraft,
} from '@/features/carpool-registration';

export type CarpoolConfirmationError =
  | 'MISSING_LOCATION'
  | 'INVALID_LOCATION'
  | 'MISSING_INFO'
  | 'INVALID_INFO'
  | 'PAST'
  | 'TOO_FAR';

export type CarpoolConfirmationSummary = {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  recruitCount: string;
};

export type PreparedCarpoolConfirmation = {
  payload: CarpoolCreatePayload;
  summary: CarpoolConfirmationSummary;
};

export type CarpoolConfirmationPreparation =
  | { valid: true; value: PreparedCarpoolConfirmation }
  | { valid: false; reason: CarpoolConfirmationError };

export function hasValidCarpoolLocation(location: CarpoolCreateDraft['origin']) {
  if (!location) {
    return false;
  }

  return Boolean(
    location.name.trim() &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180,
  );
}

function formatDepartureDate(departureAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    weekday: 'short',
  }).format(new Date(departureAt));
}

function formatDepartureTime(departureAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(new Date(departureAt));
}

export function prepareCarpoolConfirmation(
  draft: CarpoolCreateDraft,
  now = Date.now(),
  validateDepartureWindow = true,
): CarpoolConfirmationPreparation {
  if (!draft.origin || !draft.destination) {
    return { valid: false, reason: 'MISSING_LOCATION' };
  }

  if (!hasValidCarpoolLocation(draft.origin) || !hasValidCarpoolLocation(draft.destination)) {
    return { valid: false, reason: 'INVALID_LOCATION' };
  }

  if (!draft.departureDate || !draft.departureTime || draft.recruitCount === null) {
    return { valid: false, reason: 'MISSING_INFO' };
  }

  if (![1, 2, 3].includes(draft.recruitCount)) {
    return { valid: false, reason: 'INVALID_INFO' };
  }

  const departureAt = getCarpoolDepartureAt(draft.departureDate, draft.departureTime);
  if (!departureAt) {
    return { valid: false, reason: 'INVALID_INFO' };
  }

  if (validateDepartureWindow) {
    const departureValidation = validateCarpoolDepartureAt(departureAt, now);
    if (!departureValidation.valid) {
      if (departureValidation.reason === 'PAST' || departureValidation.reason === 'TOO_FAR') {
        return { valid: false, reason: departureValidation.reason };
      }

      return { valid: false, reason: 'INVALID_INFO' };
    }
  }

  return {
    valid: true,
    value: {
      payload: {
        origin_name: draft.origin.name.trim(),
        origin_lat: Number(draft.origin.lat.toFixed(6)),
        origin_lng: Number(draft.origin.lng.toFixed(6)),
        dest_name: draft.destination.name.trim(),
        dest_lat: Number(draft.destination.lat.toFixed(6)),
        dest_lng: Number(draft.destination.lng.toFixed(6)),
        departure_at: departureAt,
        recruit_count: draft.recruitCount as 1 | 2 | 3,
      },
      summary: {
        origin: draft.origin.name.trim(),
        destination: draft.destination.name.trim(),
        departureDate: formatDepartureDate(departureAt),
        departureTime: formatDepartureTime(departureAt),
        recruitCount: `${draft.recruitCount}명 모집 (+운전자)`,
      },
    },
  };
}
