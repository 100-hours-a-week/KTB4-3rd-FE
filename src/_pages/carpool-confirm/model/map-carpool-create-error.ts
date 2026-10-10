import { ApiError } from '@/shared/api/client';

export function mapCarpoolCreateError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return '등록 결과를 확인할 수 없어요. 매칭 목록을 확인한 후 다시 시도해주세요.';
  }

  switch (error.code) {
    case 'CAR_REGISTRATION_REQUIRED':
      return '차량 정보를 먼저 등록해주세요.';
    case 'DEPARTURE_TIME_PASSED':
      return '출발 시각은 현재 시각 이후로 선택해주세요.';
    case 'DEPARTURE_TIME_TOO_FAR':
      return '출발 시각은 한 달 이내로 선택해주세요.';
    case 'SAME_ORIGIN_DEST':
      return '출발지와 도착지를 다르게 선택해주세요.';
    case 'VALIDATION_ERROR':
      return '입력한 카풀 정보를 다시 확인해주세요.';
    default:
      if (error.status === 401) {
        return '로그인이 만료됐어요. 다시 로그인해주세요.';
      }

      return error.status >= 500
        ? '등록 결과를 확인할 수 없어요. 매칭 목록을 확인한 후 다시 시도해주세요.'
        : '카풀을 등록하지 못했어요. 입력한 정보를 확인해주세요.';
  }
}
