'use client';

import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/entities/auth';
import { getCurrentUser } from '@/entities/user';
import {
  getCarpoolRegistrationDraftSnapshot,
  resetCarpoolRegistrationDraft,
  resetCarpoolRegistrationDraftIfUnchanged,
} from '@/features/carpool-registration';

export function CarpoolRegistrationDraftAuthSync() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (accessToken === null) {
      resetCarpoolRegistrationDraft();
      return;
    }

    const draftAtCheckStart = getCarpoolRegistrationDraftSnapshot();
    let isCurrentCheck = true;

    void getCurrentUser(accessToken)
      .then(({ data }) => {
        if (!isCurrentCheck || useAuthStore.getState().accessToken !== accessToken) {
          return;
        }

        const previousUserId = currentUserIdRef.current;
        currentUserIdRef.current = data.id;

        if (previousUserId !== null && previousUserId !== data.id) {
          resetCarpoolRegistrationDraftIfUnchanged(draftAtCheckStart);
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
