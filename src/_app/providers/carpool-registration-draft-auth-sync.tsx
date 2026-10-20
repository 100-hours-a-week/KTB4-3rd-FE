'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/entities/auth';
import { getCurrentUser } from '@/entities/user';
import { resetCarpoolRegistrationDraft } from '@/features/carpool-registration';

export function CarpoolRegistrationDraftAuthSync() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (accessToken === null) {
      resetCarpoolRegistrationDraft();
      return;
    }

    let isCurrentCheck = true;

    void getCurrentUser(accessToken)
      .then(({ data }) => {
        if (!isCurrentCheck || useAuthStore.getState().accessToken !== accessToken) {
          return;
        }

        const previousUserId = currentUserIdRef.current;
        currentUserIdRef.current = data.id;

        if (previousUserId !== null && previousUserId !== data.id) {
          resetCarpoolRegistrationDraft();
        }
      })
      .catch(() => {
        // Identity is unresolved; preserve the draft until a current-user check succeeds.
      });

    return () => {
      isCurrentCheck = false;
    };
  }, [accessToken]);

  return null;
}
