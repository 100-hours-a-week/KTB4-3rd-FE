'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRequireAuth } from '@/features/login-required';
import { resetCarpoolRegistrationDraft } from '@/features/carpool-registration';
import { useCurrentTaxiPotQuery } from '@/features/taxi-pot-matching';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

export function useMatchingEntry() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { refetch: refetchCurrentTaxiPot } = useCurrentTaxiPotQuery({ enabled: false });
  const [isFabOpen, setIsFabOpen] = useState(false);
  const fabContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFabOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !fabContainerRef.current?.contains(event.target)) {
        setIsFabOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) {
        return;
      }

      event.preventDefault();
      setIsFabOpen(false);
      fabContainerRef.current?.querySelector<HTMLButtonElement>('button[aria-expanded]')?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isFabOpen]);

  const openCarpoolRegistration = useCallback(() => {
    setIsFabOpen(false);
    requireAuth(() => {
      resetCarpoolRegistrationDraft();
      router.push('/carpools/new');
    });
  }, [requireAuth, router]);

  const openTaxiPotRegistration = useCallback(() => {
    setIsFabOpen(false);
    requireAuth(() => {
      void refetchCurrentTaxiPot()
        .then(({ data, error }) => {
          if (error || data === undefined) {
            useSnackbarStore
              .getState()
              .showSnackbar('현재 택시팟 정보를 확인하지 못했어요. 다시 시도해주세요.', 'critical');
            return;
          }

          const currentTaxiPot = data.data;

          if (currentTaxiPot === null || currentTaxiPot === undefined) {
            router.push('/taxi-pots/new');
            return;
          }

          if (currentTaxiPot.status === 'MATCHING') {
            router.push('/taxi-pots/matching');
            return;
          }

          router.push(`/chatroom/${currentTaxiPot.chat_room_id}`);
        })
        .catch(() => {
          useSnackbarStore
            .getState()
            .showSnackbar('현재 택시팟 정보를 확인하지 못했어요. 다시 시도해주세요.', 'critical');
        });
    });
  }, [refetchCurrentTaxiPot, requireAuth, router]);

  const onCarpoolClick = openCarpoolRegistration;
  const onTaxipotClick = openTaxiPotRegistration;

  return {
    fabContainerRef,
    isFabOpen,
    onFabOpenChange: setIsFabOpen,
    onCarpoolClick,
    onTaxipotClick,
  };
}
