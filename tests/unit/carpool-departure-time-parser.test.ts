import { describe, expect, it } from 'vitest';

import { formatCarpoolDepartureAt, parseCarpoolDepartureTimestamp } from '@/entities/carpool';

describe('parseCarpoolDepartureTimestamp', () => {
  it('시간대가 없는 API 시각을 서울 시각으로 해석한다', () => {
    expect(parseCarpoolDepartureTimestamp('2026-08-24T18:40:00')).toBe(
      Date.parse('2026-08-24T09:40:00Z'),
    );
  });

  it('UTC와 명시한 시간대가 포함된 시각은 절대 시각으로 해석한다', () => {
    expect(parseCarpoolDepartureTimestamp('2026-08-24T09:40:00Z')).toBe(
      Date.parse('2026-08-24T09:40:00Z'),
    );
    expect(parseCarpoolDepartureTimestamp('2026-08-24T18:40:00+09:00')).toBe(
      Date.parse('2026-08-24T09:40:00Z'),
    );
  });

  it.each(['2026-02-29T10:00:00', '2026-04-31T10:00:00', '2026-08-24T24:00:00', 'invalid'])(
    '잘못된 시각 %s는 무시한다',
    (value) => {
      expect(parseCarpoolDepartureTimestamp(value)).toBeNull();
    },
  );
});

describe('formatCarpoolDepartureAt', () => {
  it('출발 시각을 서울 기준 날짜와 오전·오후로 표시한다', () => {
    expect(formatCarpoolDepartureAt(Date.parse('2026-08-24T09:40:00Z'))).toBe(
      '2026/08/24 18:40 (오후)',
    );
    expect(formatCarpoolDepartureAt(Date.parse('2026-08-24T00:05:00Z'))).toBe(
      '2026/08/24 09:05 (오전)',
    );
  });

  it('유효하지 않은 절대 시각에는 안내 문구를 표시한다', () => {
    expect(formatCarpoolDepartureAt(Number.NaN)).toBe('출발 시각을 확인할 수 없어요.');
  });
});
