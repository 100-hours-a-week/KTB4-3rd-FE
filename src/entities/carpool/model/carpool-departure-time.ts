const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEPARTURE_DATE_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?$/i;

/** Parses the API timestamp without changing its serialization. Zone-less values use Asia/Seoul. */
export function parseCarpoolDepartureTimestamp(value: string): number | null {
  const match = DEPARTURE_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [
    ,
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
    secondText = '0',
    fractionText = '0',
    zone,
  ] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const millisecond = Number(fractionText.padEnd(3, '0'));
  const wallTime = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  const parsedWallTime = new Date(wallTime);

  if (
    parsedWallTime.getUTCFullYear() !== year ||
    parsedWallTime.getUTCMonth() !== month - 1 ||
    parsedWallTime.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  if (zone) {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  return wallTime - SEOUL_OFFSET_MS;
}

export function formatCarpoolDepartureAt(timestamp: number): string {
  if (!Number.isFinite(timestamp)) {
    return '출발 시각을 확인할 수 없어요.';
  }

  const date = new Date(timestamp);
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(date);
  const year = dateParts.find((part) => part.type === 'year')?.value;
  const month = dateParts.find((part) => part.type === 'month')?.value;
  const day = dateParts.find((part) => part.type === 'day')?.value;
  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
  const hour = Number(timePart.split(':')[0]);
  const period = hour < 12 ? '오전' : '오후';

  return `${year}/${month}/${day} ${timePart} (${period})`;
}
