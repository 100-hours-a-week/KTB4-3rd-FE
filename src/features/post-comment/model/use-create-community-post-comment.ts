'use client';

import { useMutation } from '@tanstack/react-query';

import { refreshAccessToken, useAuthStore } from '@/entities/auth';

import {
  createCommunityPostComment,
  type CreateCommunityPostCommentPayload,
  type CreateCommunityPostCommentResponse,
} from '@/features/post-comment/api';

async function getAccessToken() {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    return accessToken;
  }

  const { data } = await refreshAccessToken();
  useAuthStore.getState().setAccessToken(data.access_token);

  return data.access_token;
}

export type CreateCommunityPostCommentVariables = {
  postId: number;
  payload: CreateCommunityPostCommentPayload;
};

export function useCreateCommunityPostCommentMutation() {
  return useMutation<
    CreateCommunityPostCommentResponse,
    Error,
    CreateCommunityPostCommentVariables
  >({
    mutationFn: async ({ postId, payload }) => {
      const accessToken = await getAccessToken();

      return createCommunityPostComment(accessToken, postId, payload);
    },
  });
}
