import type { CarpoolCreateDraft } from './carpool-create-store';
import type { TimePickerValue } from '@/shared/ui/time-picker';

const SEOUL_OFFSET_MILLISECONDS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type KoreanDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

export type CarpoolDepartureValidation =
  | { valid: true; reason: null }
  | { valid: false; reason: 'MISSING' | 'INVALID' | 'PAST' | 'TOO_FAR' };

function parseDate(value: string): { year: number; month: number; day: number } | null {
  const parts = DATE_PATTERN.exec(value);
  if (!parts) {
    return null;
  }

  const [, yearText, monthText, dayText] = parts;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const utcDate = new Date(0);
  utcDate.setUTCFullYear(year, month - 1, day);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function to24HourTime(value: TimePickerValue): number | null {
  const { period, hour, minute } = value;
  if (
    (period !== '오전' && period !== '오후') ||
    !Number.isInteger(hour) ||
    hour < 1 ||
    hour > 12 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  if (period === '오전') {
    return hour === 12 ? 0 : hour;
  }

  return hour === 12 ? 12 : hour + 12;
}

function seoulWallTimeToTimestamp(parts: KoreanDateTimeParts): number {
  const date = new Date(0);
  date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return date.getTime() - SEOUL_OFFSET_MILLISECONDS;
}

function getSeoulDateTimeParts(timestamp: number): KoreanDateTimeParts | null {
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  const date = new Date(timestamp + SEOUL_OFFSET_MILLISECONDS);
  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
  };
}

function formatDate({ year, month, day }: Pick<KoreanDateTimeParts, 'year' | 'month' | 'day'>) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getCarpoolDepartureAt(
  departureDate: string | null,
  departureTime: TimePickerValue | null,
): string | null {
  if (!departureDate || !departureTime) {
    return null;
  }

  const date = parseDate(departureDate);
  const hour = to24HourTime(departureTime);
  if (!date || hour === null) {
    return null;
  }

  const timestamp = seoulWallTimeToTimestamp({
    ...date,
    hour,
    minute: departureTime.minute,
    second: 0,
    millisecond: 0,
  });

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function getCarpoolDraftValues(draft: CarpoolCreateDraft) {
  const departureAt = getCarpoolDepartureAt(draft.departureDate, draft.departureTime);
  const isComplete = Boolean(departureAt && draft.recruitCount !== null);

  return { departureAt, isComplete, isNextDisabled: !isComplete };
}

export function getCarpoolDepartureDateRange(now = Date.now()) {
  const current = getSeoulDateTimeParts(now);
  if (!current) {
    return null;
  }

  const nextMonthIndex = current.month;
  const nextYear = current.year + Math.floor(nextMonthIndex / 12);
  const nextMonth = (nextMonthIndex % 12) + 1;
  const lastDayOfNextMonth = new Date(0);
  lastDayOfNextMonth.setUTCFullYear(nextYear, nextMonth, 0);
  const maxDay = Math.min(current.day, lastDayOfNextMonth.getUTCDate());

  const latestTimestamp = seoulWallTimeToTimestamp({
    ...current,
    year: nextYear,
    month: nextMonth,
    day: maxDay,
  });

  return {
    minDate: formatDate(current),
    maxDate: formatDate({ year: nextYear, month: nextMonth, day: maxDay }),
    latestTimestamp,
  };
}

export function validateCarpoolDepartureAt(
  departureAt: string | null,
  now = Date.now(),
): CarpoolDepartureValidation {
  if (departureAt === null) {
    return { valid: false, reason: 'MISSING' };
  }

  const departureTimestamp = new Date(departureAt).getTime();
  const dateRange = getCarpoolDepartureDateRange(now);
  if (!Number.isFinite(departureTimestamp) || !dateRange) {
    return { valid: false, reason: 'INVALID' };
  }
  if (departureTimestamp <= now) {
    return { valid: false, reason: 'PAST' };
  }
  if (departureTimestamp > dateRange.latestTimestamp) {
    return { valid: false, reason: 'TOO_FAR' };
  }

  return { valid: true, reason: null };
}

export function validateCarpoolDepartureDraft(draft: CarpoolCreateDraft, now = Date.now()) {
  return validateCarpoolDepartureAt(
    getCarpoolDepartureAt(draft.departureDate, draft.departureTime),
    now,
  );
}
