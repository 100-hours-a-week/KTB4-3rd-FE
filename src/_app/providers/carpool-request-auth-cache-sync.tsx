'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/entities/auth';
import { carpoolRequestQueryKeys } from '@/entities/carpool-request';

type ViewerIdentity = {
  accessToken: string | null;
  viewerId: number | null;
};

function getViewerIdentity(): ViewerIdentity {
  const { accessToken, verifiedViewerId } = useAuthStore.getState();
  return { accessToken, viewerId: verifiedViewerId };
}

function hasIdentityChanged(previous: ViewerIdentity, current: ViewerIdentity) {
  return previous.accessToken !== current.accessToken || previous.viewerId !== current.viewerId;
}

export function CarpoolRequestAuthCacheSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let previousIdentity = getViewerIdentity();

    return useAuthStore.subscribe(() => {
      const currentIdentity = getViewerIdentity();
      if (!hasIdentityChanged(previousIdentity, currentIdentity)) {
        return;
      }

      const previousViewerId = previousIdentity.viewerId;
      previousIdentity = currentIdentity;
      if (previousViewerId === null) {
        return;
      }

      const queryKey = carpoolRequestQueryKeys.viewer(previousViewerId);
      void queryClient.cancelQueries({ queryKey });
      queryClient.removeQueries({ queryKey });
    });
  }, [queryClient]);

  return null;
}
