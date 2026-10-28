'use client';

import { useRouter } from 'next/navigation';
import { useCallback, type MouseEvent } from 'react';

import {
  useCancelTaxiPotMatchingMutation,
  useTaxiPotMatchingWebSocket,
} from '@/features/taxi-pot-matching';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

const MATCHING_HOME_PATH = '/matching';

export function useTaxiPotMatchingPageModel() {
  const router = useRouter();
  const cancelMutation = useCancelTaxiPotMatchingMutation();

  const handleConfirm = useCallback(() => {
    router.replace(MATCHING_HOME_PATH);
  }, [router]);

  const handleMatched = useCallback(
    (chatRoomId: number) => {
      router.replace(`/chatroom/${chatRoomId}`);
    },
    [router],
  );

  useTaxiPotMatchingWebSocket({ onMatched: handleMatched });

  const handleCancel = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (cancelMutation.isPending) {
        return;
      }

      cancelMutation.mutate(undefined, {
        onError: () => {
          useSnackbarStore.getState().showSnackbar('매칭 취소를 실패했어요', 'critical');
        },
        onSuccess: () => {
          useSnackbarStore.getState().showSnackbar('매칭을 취소했어요', 'positive');
          router.replace(MATCHING_HOME_PATH);
        },
      });
    },
    [cancelMutation, router],
  );

  return {
    isCanceling: cancelMutation.isPending,
    onCancel: handleCancel,
    onConfirm: handleConfirm,
  };
}
