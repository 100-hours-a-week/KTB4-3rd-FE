import { describe, expect, it } from 'vitest';

import {
  getCarpoolDepartureAt,
  getCarpoolDepartureDateRange,
  validateCarpoolDepartureAt,
} from '@/features/carpool-registration';

const seoul = (date: string) => new Date(date).getTime();

describe('getCarpoolDepartureAt', () => {
  it('선택한 날짜와 오전 시간을 서울 시간대로 결합해 ISO 시각을 만든다', () => {
    expect(getCarpoolDepartureAt('2026-10-11', { period: '오전', hour: 8, minute: 30 })).toBe(
      '2026-10-10T23:30:00.000Z',
    );
  });

  it('정오와 자정을 구분하고 초와 밀리초를 0으로 만든다', () => {
    expect(getCarpoolDepartureAt('2026-10-11', { period: '오전', hour: 12, minute: 0 })).toBe(
      '2026-10-10T15:00:00.000Z',
    );
    expect(getCarpoolDepartureAt('2026-10-11', { period: '오후', hour: 12, minute: 0 })).toBe(
      '2026-10-11T03:00:00.000Z',
    );
    expect(getCarpoolDepartureAt('2026-10-11', { period: '오전', hour: 12, minute: 10 })).toBe(
      '2026-10-10T15:10:00.000Z',
    );
  });

  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-1-01'])(
    '잘못된 날짜 %s는 결합하지 않는다',
    (date) => {
      expect(getCarpoolDepartureAt(date, { period: '오후', hour: 1, minute: 0 })).toBeNull();
    },
  );

  it('날짜나 시간이 비어 있으면 결합하지 않는다', () => {
    expect(getCarpoolDepartureAt(null, { period: '오후', hour: 1, minute: 0 })).toBeNull();
    expect(getCarpoolDepartureAt('2026-10-11', null)).toBeNull();
  });
});

describe('getCarpoolDepartureDateRange', () => {
  it.each([
    ['1월 말은 평년 2월 마지막 날로 보정', '2027-01-31T10:30:20.250Z', '2027-02-28'],
    ['윤년 1월 말은 2월 29일로 보정', '2028-01-31T10:30:20.250Z', '2028-02-29'],
    ['12월에서 다음 해 1월로 넘어감', '2026-12-31T10:30:20.250Z', '2027-01-31'],
  ])('%s', (_label, now, maxDate) => {
    expect(getCarpoolDepartureDateRange(seoul(now))?.maxDate).toBe(maxDate);
  });

  it('날짜 상한의 시간도 현재 서울 시각을 유지한다', () => {
    const range = getCarpoolDepartureDateRange(seoul('2026-01-31T10:30:20.250Z'));
    expect(range).toEqual({
      minDate: '2026-01-31',
      maxDate: '2026-02-28',
      latestTimestamp: seoul('2026-02-28T10:30:20.250Z'),
    });
  });
});

describe('validateCarpoolDepartureAt', () => {
  const now = seoul('2026-01-31T10:30:20.250Z');

  it('현재 시각과 같거나 지난 출발 시각을 제외한다', () => {
    expect(validateCarpoolDepartureAt('2026-01-31T10:30:20.250Z', now)).toEqual({
      valid: false,
      reason: 'PAST',
    });
    expect(validateCarpoolDepartureAt('2026-01-31T10:30:00.000Z', now)).toEqual({
      valid: false,
      reason: 'PAST',
    });
  });

  it('달력상 다음 달 같은 시각 상한을 포함하고 그 이후는 제외한다', () => {
    expect(validateCarpoolDepartureAt('2026-02-28T10:30:20.250Z', now)).toEqual({
      valid: true,
      reason: null,
    });
    expect(validateCarpoolDepartureAt('2026-02-28T10:30:20.251Z', now)).toEqual({
      valid: false,
      reason: 'TOO_FAR',
    });
  });

  it('누락·잘못된 시각과 잘못된 현재 시각을 구분한다', () => {
    expect(validateCarpoolDepartureAt(null, now)).toEqual({ valid: false, reason: 'MISSING' });
    expect(validateCarpoolDepartureAt('not-a-date', now)).toEqual({
      valid: false,
      reason: 'INVALID',
    });
    expect(validateCarpoolDepartureAt('2026-02-01T00:00:00.000Z', Number.NaN)).toEqual({
      valid: false,
      reason: 'INVALID',
    });
  });
});
