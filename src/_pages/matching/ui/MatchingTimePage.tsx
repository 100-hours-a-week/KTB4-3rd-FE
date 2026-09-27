'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useMatchingRegistrationStore } from '@/features/matching-registration';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { bottomActionScrollPaddingClassName } from '@/shared/ui/bottom-action-button';
import { Dialog } from '@/shared/ui/dialog';
import { TimePicker, type TimePickerValue } from '@/shared/ui/time-picker';
import { Text } from '@/shared/ui/text';

import {
  getMatchingDepartureAt,
  getMatchingTimePickerInitialValue,
  isMatchingTimeWithinThreeHours,
} from '@/_pages/matching/model/matching-time';

export function MatchingTimePage() {
  const router = useRouter();
  const [initialTime] = useState(getMatchingTimePickerInitialValue);
  const [selectedTime, setSelectedTime] = useState<TimePickerValue>(initialTime);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const setDepartureAt = useMatchingRegistrationStore((state) => state.setDepartureAt);

  const updateSelectedTime = (value: TimePickerValue) => {
    setSelectedTime(value);
    setDepartureAt(getMatchingDepartureAt(value));
  };

  const handleNext = useCallback(() => {
    if (!isMatchingTimeWithinThreeHours(selectedTime)) {
      setIsValidationDialogOpen(true);
      return;
    }

    setDepartureAt(getMatchingDepartureAt(selectedTime));
    router.push('/matching/confirm');
  }, [router, selectedTime, setDepartureAt]);

  const handleReset = () => {
    setSelectedTime(initialTime);
    setDepartureAt(getMatchingDepartureAt(initialTime));
  };

  return (
    <div
      aria-label="탑승 희망 시간 선택"
      className="relative mx-auto flex h-dvh min-h-0 w-full max-w-[393px] flex-col overflow-hidden bg-[var(--color-bg-layer-default)]"
      data-node-id="990:27007"
    >
      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        <BackButton className="absolute top-1.5 left-1.5" href="/matching" />
      </header>

      <div aria-hidden="true" className="h-14 shrink-0" />

      <main
        className={`min-h-0 flex-1 overflow-y-auto px-5 pt-[43px] ${bottomActionScrollPaddingClassName}`}
      >
        <Text as="h1" color="fg.neutral" variant="t8Bold">
          탑승 희망 시간을 입력해주세요
        </Text>
        <Text className="mt-0.5" color="fg.neutralMuted" variant="t5Regular">
          현재 시각으로부터 3시간 이내만 가능해요
        </Text>
        <TimePicker
          aria-label="탑승 희망 시간"
          className="mt-[96px]"
          value={selectedTime}
          onValueChange={updateSelectedTime}
        />
      </main>

      <div className="fixed bottom-10 left-1/2 z-30 flex w-[calc(100%-40px)] max-w-[353px] -translate-x-1/2 flex-col gap-3 bg-[var(--color-bg-layer-default)]">
        <Button
          className="!h-[52px] !min-h-[52px] !rounded-[8px] !px-4 !py-3"
          size="large"
          textVariant="t5Bold"
          type="button"
          variant="neutral-weak"
          width="fill"
          onClick={handleReset}
        >
          초기화
        </Button>
        <Button
          className="!h-[52px] !min-h-[52px] !rounded-[8px] !px-4 !py-3"
          size="large"
          textVariant="t5Bold"
          type="button"
          variant="neutral-solid"
          width="fill"
          onClick={handleNext}
        >
          다음
        </Button>
      </div>

      <Dialog
        className="!w-[calc(100%-40px)] !max-w-[353px]"
        description="현재 시각으로부터 3시간 이내로 설정해주세요"
        open={isValidationDialogOpen}
        title="시간을 다시 입력해주세요"
        onOpenChange={setIsValidationDialogOpen}
      />
    </div>
  );
}
