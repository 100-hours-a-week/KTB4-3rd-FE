'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { useRequireAuth } from '@/features/login-required';
import { useCarpoolCreateMutation } from '@/features/carpool-create';
import {
  resetCarpoolRegistrationDraft,
  useCarpoolCreateStore,
} from '@/features/carpool-registration';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';
import { BackButton } from '@/shared/ui/back-button';
import { bottomActionSafeAreaOffsetClassName } from '@/shared/ui/bottom-action-button';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { SnackbarViewport } from '@/shared/ui/snackbar-viewport';
import { Text } from '@/shared/ui/text';

import {
  hasValidCarpoolLocation,
  prepareCarpoolConfirmation,
  type CarpoolConfirmationError,
  type CarpoolConfirmationSummary,
} from '../model/prepare-carpool-confirmation'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조
import { mapCarpoolCreateError } from '../model/map-carpool-create-error'; // oxlint-disable-line import/no-relative-parent-imports -- 동일 slice 내부 참조

const confirmationMessages: Record<CarpoolConfirmationError, string> = {
  MISSING_LOCATION: '출발지와 도착지를 입력해주세요.',
  INVALID_LOCATION: '출발지와 도착지 정보를 확인해주세요.',
  MISSING_INFO: '출발 날짜, 시간, 모집 인원을 입력해주세요.',
  INVALID_INFO: '출발 날짜와 모집 인원을 확인해주세요.',
  PAST: '출발 시각은 현재 시각 이후로 선택해주세요.',
  TOO_FAR: '출발 시각은 한 달 이내로 선택해주세요.',
};

function ConfirmationSummaryCard({ summary }: { summary: CarpoolConfirmationSummary }) {
  const rows = [
    { label: '출발지', value: summary.origin },
    { label: '도착지', value: summary.destination },
    { label: '출발 날짜', value: summary.departureDate },
    { label: '출발 시간', value: summary.departureTime },
    { label: '모집 인원', value: summary.recruitCount },
  ];

  return (
    <section
      aria-label="카풀 등록 정보"
      className="absolute top-[250px] left-5 flex w-[calc(100%-40px)] max-w-[353px] flex-col gap-2 rounded-[16px] bg-[var(--color-bg-layer-default)] p-6"
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

export function CarpoolConfirmPage() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const draft = useCarpoolCreateStore((state) => state.draft);
  const mutation = useCarpoolCreateMutation();
  const isSubmittingRef = useRef(false);
  const didSubmitSuccessfullyRef = useRef(false);
  const prepared = prepareCarpoolConfirmation(draft, undefined, false);
  const hasLocations =
    hasValidCarpoolLocation(draft.origin) && hasValidCarpoolLocation(draft.destination);
  const hasInfo = prepared.valid || prepared.reason === 'PAST' || prepared.reason === 'TOO_FAR';

  useEffect(() => {
    if (didSubmitSuccessfullyRef.current) {
      return;
    }

    if (!hasLocations) {
      router.replace('/carpools/new');
    } else if (!hasInfo) {
      router.replace('/carpools/new/info');
    }
  }, [hasInfo, hasLocations, router]);

  const handleBack = useCallback(() => {
    if (isSubmittingRef.current || mutation.isPending) {
      return;
    }

    router.push('/carpools/new/info');
  }, [mutation.isPending, router]);

  const handleSubmit = useCallback(() => {
    requireAuth(() => {
      if (isSubmittingRef.current || mutation.isPending) {
        return;
      }

      const currentDraft = useCarpoolCreateStore.getState().draft;
      const result = prepareCarpoolConfirmation(currentDraft, Date.now());
      if (!result.valid) {
        useSnackbarStore.getState().showSnackbar(confirmationMessages[result.reason], 'critical');
        return;
      }

      isSubmittingRef.current = true;
      void mutation
        .mutateAsync(result.value.payload)
        .then(() => {
          didSubmitSuccessfullyRef.current = true;
          resetCarpoolRegistrationDraft();
          useSnackbarStore.getState().showSnackbar('카풀이 등록되었어요.', 'positive');
          router.push('/matching');
        })
        .catch((error: unknown) => {
          useSnackbarStore.getState().showSnackbar(mapCarpoolCreateError(error), 'critical');
        })
        .finally(() => {
          isSubmittingRef.current = false;
        });
    });
  }, [mutation, requireAuth, router]);

  if (!prepared.valid) {
    return null;
  }

  return (
    <div
      aria-label="카풀 등록 정보 확인"
      className="relative mx-auto min-h-dvh w-full max-w-[393px] overflow-hidden bg-[var(--color-bg-layer-default)]"
      data-node-id="1417:35709"
    >
      <header className="fixed top-0 left-1/2 z-50 h-14 w-full max-w-[393px] -translate-x-1/2">
        {mutation.isPending ? (
          <button
            aria-label="뒤로가기"
            className="absolute top-1.5 left-1.5 inline-flex size-11 items-center justify-center rounded-[var(--dimension-x2)] opacity-50"
            disabled
            type="button"
          >
            <Icon aria-hidden="true" name="chevronLeft" size={24} />
          </button>
        ) : (
          <BackButton
            className="absolute top-1.5 left-1.5"
            href="/carpools/new/info"
            onClick={(event) => {
              event.preventDefault();
              handleBack();
            }}
          />
        )}
      </header>

      <main>
        <div className="absolute top-[99px] left-5">
          <Text as="h1" color="fg.neutral" variant="t8Bold">
            이 정보가 맞나요?
          </Text>
          <Text className="mt-0.5 ml-px block" color="fg.neutralMuted" variant="t5Regular">
            카풀 등록 이후에는 수정할 수 없어요.
          </Text>
        </div>

        <ConfirmationSummaryCard summary={prepared.value.summary} />
      </main>

      <Button
        className={`fixed left-1/2 z-30 !h-[52px] !min-h-[52px] !w-[calc(100%-40px)] !max-w-[353px] -translate-x-1/2 !rounded-[8px] !px-4 !py-3 ${bottomActionSafeAreaOffsetClassName}`}
        loading={mutation.isPending}
        type="button"
        variant="brand-solid"
        width="fill"
        onClick={handleSubmit}
      >
        카풀 등록하기
      </Button>
      <SnackbarViewport
        className={`fixed inset-x-0 z-[2147483647] mx-auto max-w-[393px] px-5 ${bottomActionSafeAreaOffsetClassName}`}
      />
    </div>
  );
}
