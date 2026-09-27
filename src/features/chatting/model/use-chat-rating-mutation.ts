'use client';

import { useMutation } from '@tanstack/react-query';

import {
  submitChatRatings,
  type SubmitChatRatingsPayload,
  type SubmitChatRatingsResponse,
} from '@/features/chatting/api/chat-rating';

export type SubmitChatRatingsVariables = {
  companionId: number;
  payload: SubmitChatRatingsPayload;
};

export function useChatRatingMutation() {
  return useMutation<SubmitChatRatingsResponse, Error, SubmitChatRatingsVariables>({
    mutationFn: ({ companionId, payload }) => submitChatRatings(companionId, payload),
  });
}
