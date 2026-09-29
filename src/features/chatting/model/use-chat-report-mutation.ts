'use client';

import { useMutation } from '@tanstack/react-query';

import {
  submitChatReport,
  type SubmitChatReportPayload,
  type SubmitChatReportResponse,
} from '@/features/chatting/api/chat-report';

export function useChatReportMutation() {
  return useMutation<SubmitChatReportResponse, Error, SubmitChatReportPayload>({
    mutationFn: submitChatReport,
  });
}
