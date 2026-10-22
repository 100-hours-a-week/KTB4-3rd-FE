'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  type ChatReportDialogSubmitPayload as ChatReportPayload,
  type ChatSatisfactionDialogSubmitPayload,
  type ChatSatisfactionParticipant,
  type SubmitChatReportPayload,
  useChatRatingMutation,
  useChatReportMutation,
} from '@/features/chatting';
import { useLeaveCarpoolMutation } from '@/features/leave-carpool';
import { useLeaveCompanionMutation } from '@/features/leave-companion';
import { useLeaveTaxiPotMutation } from '@/features/taxi-pot-chat';
import { useSnackbarStore } from '@/shared/model/stores/snackbar-store';

import type { ChatRoomDetailData, ChatRoomMessageData } from '@/_pages/chatting/api/chat-room';
import type { ChatReportTarget } from './chat-report-target';

const reportReasonMap = {
  abuse: 'ABUSE',
  noShow: 'NO_SHOW',
  other: 'ETC',
  unpaid: 'UNSETTLED',
} as const;

type UseChatRoomActionsModelOptions = {
  chatRoomDetail?: ChatRoomDetailData;
  chatRoomMessages?: readonly ChatRoomMessageData[];
  companionId?: number;
  currentUserId?: number;
  evaluationCompanionId?: number;
  isCarpool: boolean;
  isEvaluationOpen: boolean;
  isTaxiPot: boolean;
  onEvaluationOpenChange: (open: boolean) => void;
  taxiPotId?: string;
};

function createEvaluationParticipants(
  detail: ChatRoomDetailData | undefined,
  messages: readonly ChatRoomMessageData[] | undefined,
  currentUserId: number | undefined,
): readonly ChatSatisfactionParticipant[] | undefined {
  if (!detail) {
    return undefined;
  }

  const participantMap = new Map<number, string>();

  if (detail.participants) {
    for (const participant of detail.participants) {
      participantMap.set(participant.id, participant.nickname);
    }
  } else {
    for (const message of messages ?? []) {
      if (message.sender) {
        const senderName = message.sender.nickname ?? message.sender.name;

        if (senderName) {
          participantMap.set(message.sender.id, senderName);
        }
      }

      if (message.joiner) {
        participantMap.set(message.joiner.id, message.joiner.name);
      }

      if (message.leaver) {
        participantMap.set(message.leaver.id, message.leaver.name);
      }
    }
  }

  return [...participantMap.entries()]
    .filter(([participantId]) => participantId !== currentUserId)
    .map(([id, name]) => ({ id, name }));
}

export function useChatRoomActionsModel({
  chatRoomDetail,
  chatRoomMessages,
  companionId,
  currentUserId,
  evaluationCompanionId,
  isCarpool,
  isEvaluationOpen,
  isTaxiPot,
  onEvaluationOpenChange,
  taxiPotId,
}: UseChatRoomActionsModelOptions) {
  const router = useRouter();
  const ratingMutation = useChatRatingMutation();
  const reportMutation = useChatReportMutation();
  const leaveCarpoolMutation = useLeaveCarpoolMutation();
  const leaveCompanionMutation = useLeaveCompanionMutation();
  const leaveTaxiPotMutation = useLeaveTaxiPotMutation();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ChatReportTarget | null>(null);
  const evaluationParticipants = createEvaluationParticipants(
    chatRoomDetail,
    chatRoomMessages,
    currentUserId,
  );

  const handleReportRequest = useCallback(
    (target: ChatReportTarget) => {
      setReportTarget(target);
      setIsReportDialogOpen(true);
      if (isEvaluationOpen) {
        onEvaluationOpenChange(false);
      }
    },
    [isEvaluationOpen, onEvaluationOpenChange],
  );

  const handleEvaluationReport = useCallback(
    (participant: ChatSatisfactionParticipant) => {
      const reportedUserId = Number(participant.id);

      if (!Number.isSafeInteger(reportedUserId)) {
        useSnackbarStore.getState().showSnackbar('신고 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      handleReportRequest({ type: 'user', reportedUserId });
    },
    [handleReportRequest],
  );

  const handleEvaluationSubmit = useCallback(
    ({ ratings }: ChatSatisfactionDialogSubmitPayload) => {
      if (evaluationCompanionId === undefined) {
        return;
      }

      const apiRatings = Object.entries(ratings).map(([targetUserId, score]) => ({
        score,
        target_user_id: Number(targetUserId),
      }));

      if (
        apiRatings.some(({ target_user_id: targetUserId }) => !Number.isSafeInteger(targetUserId))
      ) {
        useSnackbarStore.getState().showSnackbar('평가 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      ratingMutation.mutate(
        {
          companionId: evaluationCompanionId,
          payload: { ratings: apiRatings },
        },
        {
          onError: (error) => {
            useSnackbarStore
              .getState()
              .showSnackbar(error.message || '평가를 제출하지 못했어요', 'critical');
          },
          onSuccess: () => onEvaluationOpenChange(false),
        },
      );
    },
    [evaluationCompanionId, onEvaluationOpenChange, ratingMutation],
  );

  const handleReportSubmit = useCallback(
    ({ description, reason }: ChatReportPayload) => {
      if (!reportTarget) {
        return;
      }

      let payload: SubmitChatReportPayload;

      if (reportTarget.type === 'message') {
        payload = {
          reason: reportReasonMap[reason],
          reason_text: reason === 'other' ? description.trim() : null,
          reported_message_id: reportTarget.reportedMessageId,
          reported_user_id: reportTarget.reportedUserId,
        };
      } else if (companionId !== undefined && Number.isSafeInteger(companionId)) {
        payload = {
          companion_id: companionId,
          reason: reportReasonMap[reason],
          reason_text: reason === 'other' ? description.trim() : null,
          reported_user_id: reportTarget.reportedUserId,
        };
      } else {
        useSnackbarStore.getState().showSnackbar('신고 대상 정보를 불러오지 못했어요', 'critical');
        return;
      }

      reportMutation.mutate(payload, {
        onError: (error) => {
          useSnackbarStore
            .getState()
            .showSnackbar(error.message || '신고를 접수하지 못했어요', 'critical');
        },
        onSuccess: () => {
          setIsReportDialogOpen(false);
          setReportTarget(null);
        },
      });
    },
    [companionId, reportMutation, reportTarget],
  );

  const handleReportDialogChange = useCallback((open: boolean) => {
    setIsReportDialogOpen(open);
    if (!open) {
      setReportTarget(null);
    }
  }, []);

  const handleLeaveConfirm = useCallback(async () => {
    if (companionId === undefined) {
      return;
    }

    try {
      if (isCarpool) {
        await leaveCarpoolMutation.mutateAsync(companionId);
      } else if (isTaxiPot) {
        await leaveTaxiPotMutation.mutateAsync(Number(taxiPotId));
      } else {
        await leaveCompanionMutation.mutateAsync(companionId);
      }

      setIsLeaveDialogOpen(false);
      useSnackbarStore.getState().showSnackbar('채팅방을 나갔어요', 'positive');
      router.push('/');
    } catch (error) {
      useSnackbarStore
        .getState()
        .showSnackbar(
          error instanceof Error ? error.message : '채팅방을 나가지 못했어요',
          'critical',
        );
    }
  }, [
    companionId,
    isCarpool,
    isTaxiPot,
    leaveCarpoolMutation,
    leaveCompanionMutation,
    leaveTaxiPotMutation,
    router,
    taxiPotId,
  ]);

  return {
    evaluationParticipants,
    handleEvaluationReport,
    handleEvaluationSubmit,
    handleLeave: () => setIsLeaveDialogOpen(true),
    handleLeaveConfirm,
    handleReportDialogChange,
    handleReportRequest,
    handleReportSubmit,
    isLeaveDialogOpen,
    isReportDialogOpen,
    leaveLoading:
      leaveCarpoolMutation.isPending ||
      leaveCompanionMutation.isPending ||
      leaveTaxiPotMutation.isPending,
    ratingLoading: ratingMutation.isPending,
    reportLoading: reportMutation.isPending,
    setIsLeaveDialogOpen,
  };
}
