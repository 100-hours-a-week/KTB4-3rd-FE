'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import {
  getCarpoolDepartureAt,
  getCarpoolDepartureDateRange,
  getCarpoolDraftValues,
  useCarpoolCreateStore,
  validateCarpoolDepartureDraft,
  type CarpoolRecruitCount,
} from '@/features/carpool-registration';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BackButton } from '@/shared/ui/back-button';
import {
  BottomActionButton,
  bottomActionSafeAreaOffsetClassName,
  bottomActionScrollPaddingClassName,
} from '@/shared/ui/bottom-action-button';
import { DateInputButton } from '@/shared/ui/date-input-button';
import { Field } from '@/shared/ui/field';
import { Select, type SelectOption } from '@/shared/ui/select';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { Text } from '@/shared/ui/text';
import { TimeInputButton } from '@/shared/ui/time-input-button';

const recruitCountOptions: SelectOption<string>[] = [
  { value: '1', label: '1명' },
  { value: '2', label: '2명' },
  { value: '3', label: '3명' },
];

const validationMessages = {
  MISSING: '출발 날짜와 시간을 선택해주세요.',
  INVALID: '출발 시각을 확인할 수 없어요.',
  PAST: '출발 시각은 현재 시각 이후로 선택해주세요.',
  TOO_FAR: '출발 시각은 한 달 이내로 선택해주세요.',
} as const;

function toLocalCalendarDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!parts) {
    return null;
  }

  const [, year, month, day] = parts;
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

function toDateKey(value: Date | null) {
  if (!value || !Number.isFinite(value.getTime())) {
    return null;
  }

  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function hasValidLocation(location: { name: string; lat: number; lng: number } | null) {
  return Boolean(
    location &&
    location.name.trim() &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180,
  );
}

export function CarpoolInfoPage() {
  const router = useRouter();
  const draft = useCarpoolCreateStore((state) => state.draft);
  const setDepartureDate = useCarpoolCreateStore((state) => state.setDepartureDate);
  const setDepartureTime = useCarpoolCreateStore((state) => state.setDepartureTime);
  const setRecruitCount = useCarpoolCreateStore((state) => state.setRecruitCount);
  const { isNextDisabled } = getCarpoolDraftValues(draft);
  const dateRange = getCarpoolDepartureDateRange();
  const hasLocations = hasValidLocation(draft.origin) && hasValidLocation(draft.destination);

  useEffect(() => {
    if (!hasLocations) {
      router.replace('/carpools/new');
    }
  }, [hasLocations, router]);

  const handleNext = useCallback(() => {
    const latestDepartureAt = getCarpoolDepartureAt(draft.departureDate, draft.departureTime);
    const validation = validateCarpoolDepartureDraft(draft, Date.now());
    if (!validation.valid) {
      useSnackbarStore.getState().showSnackbar(validationMessages[validation.reason], 'critical');
      return;
    }

    if (!latestDepartureAt || draft.recruitCount === null) {
      useSnackbarStore.getState().showSnackbar(validationMessages.MISSING, 'critical');
      return;
    }

    router.push('/carpools/new/confirm');
  }, [draft, router]);

  const localToday = toLocalCalendarDate(dateRange?.minDate ?? null);
  const localMaxDate = toLocalCalendarDate(dateRange?.maxDate ?? null);

  return (
    <div
      aria-label="카풀 추가 정보 입력"
      className="relative mx-auto flex h-dvh min-h-0 w-full max-w-[393px] flex-col overflow-hidden bg-[var(--color-bg-layer-default)]"
      data-node-id="1417:35702"
    >
      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton className="absolute top-1.5 left-1.5" href="/carpools/new" />
      </header>

      <div aria-hidden="true" className="h-14 shrink-0" />

      <main
        className={`min-h-0 flex-1 overflow-y-auto px-5 pt-[43px] ${bottomActionScrollPaddingClassName}`}
      >
        <Text as="h1" color="fg.neutral" variant="t8Bold">
          추가 정보를 입력해주세요
        </Text>
        <Text className="mt-0.5" color="fg.neutralMuted" variant="t5Regular">
          카풀 등록에 필요한 정보를 입력해주세요
        </Text>

        <div className="mx-auto mt-[65px] flex w-[313px] flex-col gap-5" data-node-id="1417:45574">
          <Field
            className="h-[110px]"
            inputSlot={
              <DateInputButton
                aria-label="출발 날짜"
                datePickerProps={{
                  maxDate: localMaxDate ?? undefined,
                  minDate: localToday ?? undefined,
                  today: localToday ?? undefined,
                }}
                value={toLocalCalendarDate(draft.departureDate)}
                onValueChange={(value) => setDepartureDate(toDateKey(value))}
              />
            }
            label={
              <Text as="span" color="fg.neutral" variant="t4Bold">
                출발 날짜
              </Text>
            }
            required
          />

          <Field
            className="h-[110px]"
            inputSlot={
              <TimeInputButton
                aria-label="출발 시간"
                value={draft.departureTime}
                onValueChange={setDepartureTime}
              />
            }
            label={
              <Text as="span" color="fg.neutral" variant="t4Bold">
                출발 시간
              </Text>
            }
            required
          />

          <Field
            className="h-[110px]"
            inputSlot={
              <Select
                aria-label="모집 인원"
                options={recruitCountOptions}
                placeholder="인원을 선택해 주세요"
                value={draft.recruitCount === null ? null : String(draft.recruitCount)}
                onValueChange={(value) =>
                  setRecruitCount(value === null ? null : (Number(value) as CarpoolRecruitCount))
                }
              />
            }
            label={
              <Text as="span" color="fg.neutral" variant="t4Bold">
                모집 인원
              </Text>
            }
            required
          />
        </div>
      </main>

      <div
        className={`fixed left-1/2 z-30 flex w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 flex-col bg-[var(--color-bg-layer-default)] ${bottomActionSafeAreaOffsetClassName}`}
      >
        <BottomActionButton disabled={isNextDisabled} type="button" onClick={handleNext}>
          다음
        </BottomActionButton>
      </div>

      <SnackbarViewport className="fixed inset-x-0 bottom-[calc(var(--dimension-x13)+var(--spacing-y-screen-bottom)+env(safe-area-inset-bottom,0px)+16px)] z-[2147483647] mx-auto max-w-[393px] px-5" />
    </div>
  );
}
