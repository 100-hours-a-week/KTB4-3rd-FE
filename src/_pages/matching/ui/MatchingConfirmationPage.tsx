'use client';

import { useMemo } from 'react';

import { useMatchingRegistrationStore } from '@/features/matching-registration';
import { BackButton } from '@/shared/ui/back-button';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

function formatDepartureAt(departureAt: string | null) {
  if (!departureAt) {
    return '-';
  }

  const departure = new Date(departureAt);

  if (Number.isNaN(departure.getTime())) {
    return '-';
  }

  return departure.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MatchingConfirmationSummaryCard({
  rows,
}: {
  rows: readonly { label: string; value: string }[];
}) {
  return (
    <section
      aria-label="매칭 등록 정보"
      className="absolute top-[268px] left-5 flex h-[216px] w-[353px] flex-col gap-4 rounded-[16px] bg-[var(--color-bg-layer-default)] p-6"
    >
      {rows.map(({ label, value }) => (
        <div className="flex h-12 w-full items-center overflow-hidden" key={label}>
          <Text
            className="flex h-12 w-[108px] shrink-0 items-center"
            color="fg.neutralMuted"
            variant="t6Regular"
          >
            {label}
          </Text>
          <Text
            className="flex h-12 min-w-0 flex-1 items-center truncate"
            color="fg.neutral"
            variant="t7Bold"
          >
            {value}
          </Text>
        </div>
      ))}
    </section>
  );
}

export function MatchingConfirmationPage() {
  const originName = useMatchingRegistrationStore((state) => state.origin_name);
  const destinationName = useMatchingRegistrationStore((state) => state.dest_name);
  const departureAt = useMatchingRegistrationStore((state) => state.departure_at);
  const confirmationRows = useMemo(
    () => [
      { label: '출발지', value: originName ?? '-' },
      { label: '도착지', value: destinationName ?? '-' },
      { label: '탑승 시간', value: formatDepartureAt(departureAt) },
    ],
    [departureAt, destinationName, originName],
  );

  return (
    <div
      aria-label="매칭 등록 정보 확인"
      className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-default)]"
      data-node-id="990:27039"
    >
      <header className="absolute top-0 left-0 h-14 w-full">
        <BackButton className="absolute top-1.5 left-1.5" href="/matching/time" />
      </header>

      <main>
        <div className="absolute top-[99px] left-5">
          <Text as="h1" color="fg.neutral" variant="t8Bold">
            이 정보가 맞나요?
          </Text>
          <Text className="mt-0.5 ml-px block" color="fg.neutralMuted" variant="t5Regular">
            매칭 등록 이후에는 수정할 수 없어요.
          </Text>
        </div>

        <MatchingConfirmationSummaryCard rows={confirmationRows} />
      </main>

      <Button
        className="absolute bottom-10 left-5 !h-[52px] !min-h-[52px] !w-[calc(100%-40px)] !rounded-[8px] !px-4 !py-3"
        size="large"
        type="button"
        variant="brand-solid"
        width="fill"
      >
        매칭 시작하기
      </Button>
    </div>
  );
}
