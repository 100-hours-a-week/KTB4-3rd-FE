'use client';

import { useMutation } from '@tanstack/react-query';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';
import {
  createCompanionPost,
  createCommunityPost,
  type PostCreateResponse,
} from '@/features/post-create/api';
import type { CompanionPostCreatePayload, CommunityPostCreatePayload } from './post-create.types';

export type PostCreateMutationVariables =
  | { type: 'COMPANION'; payload: CompanionPostCreatePayload }
  | { type: 'COMMUNITY'; payload: CommunityPostCreatePayload };

async function getAccessToken() {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    return accessToken;
  }

  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

export function usePostCreateMutation() {
  return useMutation<PostCreateResponse, Error, PostCreateMutationVariables>({
    mutationFn: async ({ payload, type }) => {
      const accessToken = await getAccessToken();

      if (type === 'COMPANION') {
        return createCompanionPost(accessToken, payload);
      }

      return createCommunityPost(accessToken, payload);
    },
  });
}
