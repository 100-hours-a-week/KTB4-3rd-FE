import { describe, expect, it } from 'vitest';

import {
  prepareCarpoolConfirmation,
  type CarpoolConfirmationError,
} from '@/_pages/carpool-confirm/model/prepare-carpool-confirmation';
import { mapCarpoolCreateError } from '@/_pages/carpool-confirm/model/map-carpool-create-error';
import type { CarpoolCreateDraft } from '@/features/carpool-registration';
import { ApiError } from '@/shared/api/client';

const completeDraft: CarpoolCreateDraft = {
  origin: { name: ' 판교역 ', lat: 37.39451234, lng: 127.11123456 },
  destination: { name: '강남역', lat: 37.49791234, lng: 127.02761234 },
  departureDate: '2026-10-12',
  departureTime: { period: '오후', hour: 5, minute: 30 },
  recruitCount: 2,
};

const fixedNow = Date.parse('2026-10-11T00:00:00.000Z');

describe('prepareCarpoolConfirmation', () => {
  it('검증된 draft를 서울 시간 ISO와 소수점 여섯 자리 좌표로 변환한다', () => {
    const result = prepareCarpoolConfirmation(completeDraft, fixedNow);

    expect(result).toEqual({
      valid: true,
      value: {
        payload: {
          origin_name: '판교역',
          origin_lat: 37.394512,
          origin_lng: 127.111235,
          dest_name: '강남역',
          dest_lat: 37.497912,
          dest_lng: 127.027612,
          departure_at: '2026-10-12T08:30:00.000Z',
          recruit_count: 2,
        },
        summary: {
          origin: '판교역',
          destination: '강남역',
          departureDate: expect.stringContaining('10월 12일'),
          departureTime: expect.stringContaining('5:30'),
          recruitCount: '2명 모집 (+운전자)',
        },
      },
    });
  });

  it.each([
    [{ ...completeDraft, origin: null }, 'MISSING_LOCATION'],
    [
      {
        ...completeDraft,
        destination: { name: '  ', lat: 37.49791234, lng: 127.02761234 },
      },
      'INVALID_LOCATION',
    ],
    [{ ...completeDraft, departureTime: null }, 'MISSING_INFO'],
    [{ ...completeDraft, departureDate: '2026-02-30' }, 'INVALID_INFO'],
    [{ ...completeDraft, recruitCount: 4 as CarpoolCreateDraft['recruitCount'] }, 'INVALID_INFO'],
    [{ ...completeDraft, departureDate: '2026-10-10' }, 'PAST'],
    [{ ...completeDraft, departureDate: '2026-11-12' }, 'TOO_FAR'],
  ] as [CarpoolCreateDraft, CarpoolConfirmationError][])(
    'draft 오류를 %s로 반환한다',
    (draft, expected) => {
      expect(prepareCarpoolConfirmation(draft, fixedNow)).toEqual({
        valid: false,
        reason: expected,
      });
    },
  );

  it('같은 출발지와 도착지는 API가 명세 오류를 반환하도록 허용한다', () => {
    const sameLocationDraft = {
      ...completeDraft,
      destination: completeDraft.origin,
    };

    expect(prepareCarpoolConfirmation(sameLocationDraft, fixedNow).valid).toBe(true);
  });

  it('시간이 지난 뒤에는 표시용 요약을 유지하고 제출 시 검증에서 실패한다', () => {
    const expiredNow = Date.parse('2026-10-12T08:31:00.000Z');

    expect(prepareCarpoolConfirmation(completeDraft, expiredNow, false).valid).toBe(true);
    expect(prepareCarpoolConfirmation(completeDraft, expiredNow)).toEqual({
      valid: false,
      reason: 'PAST',
    });
  });
});

describe('mapCarpoolCreateError', () => {
  it.each([
    [
      new ApiError(400, { error: { code: 'VALIDATION_ERROR' } }),
      '입력한 카풀 정보를 다시 확인해주세요.',
    ],
    [
      new ApiError(422, { error: { code: 'DEPARTURE_TIME_PASSED' } }),
      '출발 시각은 현재 시각 이후로 선택해주세요.',
    ],
    [
      new ApiError(422, { error: { code: 'DEPARTURE_TIME_TOO_FAR' } }),
      '출발 시각은 한 달 이내로 선택해주세요.',
    ],
    [
      new ApiError(400, { error: { code: 'SAME_ORIGIN_DEST' } }),
      '출발지와 도착지를 다르게 선택해주세요.',
    ],
    [
      new ApiError(409, { error: { code: 'CAR_REGISTRATION_REQUIRED' } }),
      '차량 정보를 먼저 등록해주세요.',
    ],
    [new ApiError(401), '로그인이 만료됐어요. 다시 로그인해주세요.'],
    [new ApiError(503), '등록 결과를 확인할 수 없어요. 매칭 목록을 확인한 후 다시 시도해주세요.'],
    [
      new TypeError('Failed to fetch'),
      '등록 결과를 확인할 수 없어요. 매칭 목록을 확인한 후 다시 시도해주세요.',
    ],
  ])('API 또는 네트워크 오류에 문서화된 안내를 반환한다', (error, expectedMessage) => {
    expect(mapCarpoolCreateError(error)).toBe(expectedMessage);
  });
});
