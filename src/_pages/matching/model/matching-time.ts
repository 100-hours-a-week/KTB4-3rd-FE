import type { TimePickerValue } from '@/shared/ui/time-picker';

const TIME_PICKER_MINUTE_STEP = 10;
const MATCHING_TIME_LIMIT_IN_HOURS = 3;

export function getMatchingTimePickerInitialValue(now = new Date()): TimePickerValue {
  const roundedTime = new Date(now);
  const minutes = roundedTime.getMinutes();
  const hasSubMinute = roundedTime.getSeconds() > 0 || roundedTime.getMilliseconds() > 0;
  const minutesToAdd =
    minutes % TIME_PICKER_MINUTE_STEP === 0 && !hasSubMinute
      ? 0
      : TIME_PICKER_MINUTE_STEP - (minutes % TIME_PICKER_MINUTE_STEP);

  roundedTime.setMinutes(minutes + minutesToAdd, 0, 0);

  const hour = roundedTime.getHours();
  const hourInTwelveHourFormat = (hour % 12 || 12) as TimePickerValue['hour'];

  return {
    period: hour >= 12 ? '오후' : '오전',
    hour: hourInTwelveHourFormat,
    minute: roundedTime.getMinutes() as TimePickerValue['minute'],
  };
}

function toTwentyFourHour(value: TimePickerValue) {
  if (value.period === '오전') {
    return value.hour === 12 ? 0 : value.hour;
  }

  return value.hour === 12 ? 12 : value.hour + 12;
}

export function getMatchingDepartureAt(value: TimePickerValue, now = new Date()): string {
  const departure = new Date(now);

  departure.setHours(toTwentyFourHour(value), value.minute, 0, 0);

  if (departure.getTime() < now.getTime()) {
    departure.setDate(departure.getDate() + 1);
  }

  return departure.toISOString();
}

export function isMatchingTimeWithinThreeHours(value: TimePickerValue, now = new Date()): boolean {
  const selectedTime = new Date(now);

  selectedTime.setHours(toTwentyFourHour(value), value.minute, 0, 0);

  if (selectedTime.getTime() < now.getTime()) {
    selectedTime.setDate(selectedTime.getDate() + 1);
  }

  const latestAllowedTime = new Date(now);
  latestAllowedTime.setHours(latestAllowedTime.getHours() + MATCHING_TIME_LIMIT_IN_HOURS);

  return selectedTime.getTime() <= latestAllowedTime.getTime();
}
