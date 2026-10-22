'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  createTaxiPotChatEntryMessages,
  getLatestTaxiPotRideAction,
  isTaxiPotRideActionMessage,
  taxiPotQueries,
  type TaxiPotChatEntryMessage,
  useTaxiPotChatFlow,
} from '@/features/taxi-pot-chat';
import { useCarpoolStatusMutation } from '@/features/carpool-chat';
import { useCurrentUserQuery } from '@/features/user-profile';

import { useChatRoomQueries, useChatRoomReadMarkerMutation } from '@/_pages/chatting/api/chat-room';
import { createChatRoomFromApi, type ChatRoom, type ChatRoomMessage } from './chat-room';
import { useChatRoomActionsModel } from './use-chat-room-actions-model';
import { useChatRoomLiveMessagesModel } from './use-chat-room-live-messages-model';
import { useChatRoomSettlementModel } from './use-chat-room-settlement-model';

function toChatRoomMessage(message: TaxiPotChatEntryMessage): ChatRoomMessage {
  return {
    id: message.id,
    kind: 'bubble',
    content: message.content,
    variant: message.variant,
    layout: message.layout === 'guide' ? 'large' : 'default',
    loading: message.loading,
  };
}

function getLastPersistedMessageId(messages: readonly { id: string | number }[]) {
  let latestMessage: { id: string; numericId: number } | undefined;

  for (const message of messages) {
    const numericId = Number(message.id);

    if (!Number.isSafeInteger(numericId)) {
      continue;
    }

    if (!latestMessage || numericId > latestMessage.numericId) {
      latestMessage = { id: String(message.id), numericId };
    }
  }

  return latestMessage?.id;
}

export function useChattingPageModel(roomId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    detailQuery,
    afterCursor,
    fetchNewerMessages,
    fetchPreviousMessages,
    hasNewerMessages,
    hasPreviousMessages,
    isFetchNewerMessagesError,
    isFetchPreviousMessagesError,
    isFetchingNewerMessages,
    isFetchingPreviousMessages,
    messagesQuery,
  } = useChatRoomQueries(roomId);
  const currentUserQuery = useCurrentUserQuery();
  const chatRoomDetail = detailQuery.data?.data;
  const companionId = chatRoomDetail?.companion_id;
  const currentUserId = currentUserQuery.data?.data.id;
  const isCarpool = chatRoomDetail?.kind === 'CARPOOL';
  const carpoolStatusMutation = useCarpoolStatusMutation(
    isCarpool && companionId !== undefined ? String(companionId) : '',
  );
  const taxiPotId =
    chatRoomDetail?.kind === 'TAXI_POT' ? String(chatRoomDetail.companion_id) : undefined;
  const isTaxiPot = taxiPotId !== undefined;
  const isRideActionChat = isTaxiPot || isCarpool;
  const rideActionChatId =
    isRideActionChat && companionId !== undefined ? String(companionId) : undefined;
  const evaluationCompanionId = isRideActionChat ? companionId : undefined;
  const taxiPotQuery = useQuery({
    ...taxiPotQueries.detail(taxiPotId ?? ''),
    enabled: isTaxiPot,
  });
  const taxiPotDetail = taxiPotQuery.data?.data;
  const settlementId = taxiPotDetail?.settlement_id;
  const readMarkerMutation = useChatRoomReadMarkerMutation();
  const chatRoomMessages = useMemo(
    () => messagesQuery.data?.pages.flatMap((page) => page.data.items) ?? [],
    [messagesQuery.data?.pages],
  );
  const initialRideAction = isRideActionChat
    ? getLatestTaxiPotRideAction(chatRoomMessages)
    : undefined;
  const chatRoomMessagesForDisplay = useMemo(
    () =>
      isRideActionChat
        ? chatRoomMessages.filter((message) => !isTaxiPotRideActionMessage(message))
        : chatRoomMessages,
    [chatRoomMessages, isRideActionChat],
  );
  const taxiPotFlow = useTaxiPotChatFlow({
    currentUserId,
    initialRideAction,
    rideActionChatId,
    rideActionHostId: isRideActionChat ? chatRoomDetail?.host_id : undefined,
    rideActionStatus: isRideActionChat ? chatRoomDetail?.companion_status : undefined,
    rideStatusMutation: isCarpool ? carpoolStatusMutation : undefined,
    taxiPotDetail,
    taxiPotId,
  });
  const isTaxiPotHost = isTaxiPot && taxiPotFlow.isHost;
  const isRideActionHost = isRideActionChat && taxiPotFlow.isHost;
  const handleRideEnded = useCallback(() => {
    if (!taxiPotId) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: taxiPotQueries.detail(taxiPotId).queryKey,
    });
  }, [queryClient, taxiPotId]);
  const baseMemberCount = taxiPotDetail?.current_count ?? chatRoomDetail?.current_count;
  const liveMessagesModel = useChatRoomLiveMessagesModel({
    afterCursor,
    baseMemberCount,
    currentUserId,
    fetchNewerMessages,
    onRideActionMessage: taxiPotFlow.handleWebSocketMessage,
    onRideEnded: handleRideEnded,
    roomId,
  });
  const actions = useChatRoomActionsModel({
    chatRoomDetail,
    chatRoomMessages,
    companionId,
    currentUserId,
    evaluationCompanionId,
    isCarpool,
    isEvaluationOpen: taxiPotFlow.isEvaluationOpen,
    isTaxiPot,
    onEvaluationOpenChange: taxiPotFlow.onEvaluationOpenChange,
    taxiPotId,
  });
  const settlement = useChatRoomSettlementModel(settlementId, isTaxiPotHost);
  const baseRoom =
    chatRoomDetail && messagesQuery.data
      ? createChatRoomFromApi(chatRoomDetail, chatRoomMessagesForDisplay, currentUserId)
      : undefined;
  const taxiPotEntryMessages = taxiPotDetail
    ? createTaxiPotChatEntryMessages(taxiPotDetail).map(toChatRoomMessage)
    : [];
  const room: ChatRoom | undefined = baseRoom
    ? {
        ...baseRoom,
        memberCount: liveMessagesModel.liveMemberCount ?? baseRoom.memberCount,
        memberLimit: taxiPotDetail?.capacity ?? baseRoom.memberLimit,
        messages: [...taxiPotEntryMessages, ...baseRoom.messages],
      }
    : undefined;
  const lastMessageId = useMemo(
    () =>
      getLastPersistedMessageId([
        ...chatRoomMessages,
        ...(room?.messages ?? []),
        ...liveMessagesModel.liveMessages,
      ]),
    [chatRoomMessages, liveMessagesModel.liveMessages, room?.messages],
  );
  const handleBack = useCallback(async () => {
    if (lastMessageId) {
      try {
        await readMarkerMutation.mutateAsync({
          lastReadMessageId: lastMessageId,
          roomId,
        });
      } catch {
        // 읽음 처리가 실패해도 채팅방에서 나가는 동작은 계속 진행한다.
      }
    }

    router.push('/');
  }, [lastMessageId, readMarkerMutation, roomId, router]);

  return {
    activeMeterAmountTarget: settlement.activeMeterAmountTarget,
    activeTransferFailedSettlementId: settlement.activeTransferFailedSettlementId,
    analysisResetKey: settlement.analysisResetKey,
    completingSettlement: settlement.completingSettlement,
    currentUserId,
    detailQuery: { isError: detailQuery.isError, isPending: detailQuery.isPending },
    evaluationParticipants: actions.evaluationParticipants,
    hasNewerMessages,
    hasNewMessages: liveMessagesModel.hasNewMessages,
    hasPreviousMessages,
    hideMeterRequestMessage: settlement.meterAnalysisStatus === 'PASSED',
    isEvaluationOpen: taxiPotFlow.isEvaluationOpen,
    isFetchNewerMessagesError,
    isFetchPreviousMessagesError,
    isFetchingNewerMessages,
    isFetchingPreviousMessages,
    isLeaveDialogOpen: actions.isLeaveDialogOpen,
    leaveLoading: actions.leaveLoading,
    isMeterAnalysisDelayed: settlement.isMeterAnalysisDelayed,
    isMeterAnalysisOpen: settlement.isMeterAnalysisOpen,
    isReportDialogOpen: actions.isReportDialogOpen,
    isRideActionHost,
    isTaxiPot,
    isTaxiPotHost,
    isTransferAnalysisOpen: settlement.isTransferAnalysisOpen,
    liveMessages: liveMessagesModel.liveMessages,
    messagesQuery: { isError: messagesQuery.isError, isPending: messagesQuery.isPending },
    meterAmount: settlement.meterAmount,
    meterImageTarget: settlement.meterImageTarget,
    meterSettlementId: settlement.meterSettlementId,
    onAcknowledgeSettlement: settlement.handleAcknowledgeSettlement,
    onBack: handleBack,
    onEvaluationOpenChange: taxiPotFlow.onEvaluationOpenChange,
    onEvaluationReport: actions.handleEvaluationReport,
    onEvaluationSubmit: actions.handleEvaluationSubmit,
    onLeave: actions.handleLeave,
    onLeaveConfirm: actions.handleLeaveConfirm,
    onLeaveDialogChange: actions.setIsLeaveDialogOpen,
    onLoadNewerMessages: liveMessagesModel.handleLoadNewerMessages,
    onLoadPreviousMessages: fetchPreviousMessages,
    onManualMeterEntry: settlement.handleManualMeterEntry,
    onMeterAmountChange: settlement.onMeterAmountChange,
    onMeterAmountOpenChange: settlement.onMeterAmountOpenChange,
    onMeterImageOpenChange: settlement.onMeterImageOpenChange,
    onRegisterMeterPhotoPicker: settlement.handleRegisterMeterPhotoPicker,
    onRegisterTransferPhotoPicker: settlement.handleRegisterTransferPhotoPicker,
    onReport: actions.handleReportRequest,
    onReportDialogChange: actions.handleReportDialogChange,
    onReportSubmit: actions.handleReportSubmit,
    onReselectTransferPhoto: settlement.handleReselectTransferPhoto,
    onRetakeMeterPhoto: settlement.handleRetakeMeterPhoto,
    onRideActionConfirm: taxiPotFlow.confirmRideAction,
    onSendMeterPhoto: settlement.handleSendMeterPhoto,
    onSendTransferPhoto: settlement.handleSendTransferPhoto,
    onSettleMeterAmount: settlement.handleSettleMeterAmount,
    onTransferProofOpenChange: settlement.onTransferProofOpenChange,
    onViewMeterImage: settlement.handleViewMeterImage,
    onViewTransferProof: settlement.handleViewTransferProof,
    onWebSocketOpen: settlement.handleRefreshSettlementStatus,
    ratingLoading: actions.ratingLoading,
    remainingMeterAttempts: settlement.remainingMeterAttempts,
    reportLoading: actions.reportLoading,
    rideAction: taxiPotFlow.rideAction,
    rideActionLoading: taxiPotFlow.isPending,
    room,
    savingSettlementAmount: settlement.savingSettlementAmount,
    taxiPotDetail,
    taxiPotQuery: { isError: taxiPotQuery.isError, isPending: taxiPotQuery.isPending },
    taxiPotStatus: taxiPotFlow.status,
    transferProofTarget: settlement.transferProofTarget,
    transferSubmissionBlockedSettlementId: settlement.transferSubmissionBlockedSettlementId,
    uploadingSettlementPhoto: settlement.uploadingSettlementPhoto,
    onMessage: liveMessagesModel.handleWebSocketMessage,
    onSettlementAnalysisFinished: settlement.handleSettlementAnalysisFinished,
  };
}
