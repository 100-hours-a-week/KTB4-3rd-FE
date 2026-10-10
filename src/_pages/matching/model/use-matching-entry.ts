'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRequireAuth } from '@/features/login-required';
import { resetCarpoolRegistrationDraft } from '@/features/carpool-registration';

export function useMatchingEntry() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
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

  const openRegistration = useCallback(
    (path: '/carpools/new' | '/taxi-pots/new') => {
      setIsFabOpen(false);
      requireAuth(() => {
        if (path === '/carpools/new') {
          resetCarpoolRegistrationDraft();
        }
        router.push(path);
      });
    },
    [requireAuth, router],
  );

  const onCarpoolClick = useCallback(() => openRegistration('/carpools/new'), [openRegistration]);
  const onTaxipotClick = useCallback(() => openRegistration('/taxi-pots/new'), [openRegistration]);

  return {
    fabContainerRef,
    isFabOpen,
    onFabOpenChange: setIsFabOpen,
    onCarpoolClick,
    onTaxipotClick,
  };
}
